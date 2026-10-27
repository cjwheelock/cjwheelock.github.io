/* Private company dashboards. Run behind HTTPS; no private content is served
 * from the public GitHub Pages repository. Node 20+, no external dependencies. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

const root = path.resolve(__dirname, '..');
const privateDir = process.env.GTM_PRIVATE_DIR;
const bundlePath = process.env.GTM_BUNDLE_PATH;
if (!privateDir && !bundlePath) throw new Error('Set GTM_PRIVATE_DIR or GTM_BUNDLE_PATH to the private data.');
let bundledFiles = null;
if (bundlePath) {
  const encoded = fs.readFileSync(bundlePath, 'utf8').trim();
  const decoded = JSON.parse(zlib.brotliDecompressSync(Buffer.from(encoded,'base64')).toString('utf8'));
  if (decoded.version !== 1 || !decoded.files || typeof decoded.files !== 'object') throw new Error('Invalid private bundle.');
  bundledFiles = decoded.files;
}
function privateFile(name, dir=privateDir) {
  if (path.basename(name) !== name) throw new Error('Invalid private filename.');
  if (bundledFiles) {
    if (!Object.hasOwn(bundledFiles,name)) throw new Error('Private file missing.');
    return Buffer.from(bundledFiles[name],'base64');
  }
  return fs.readFileSync(path.join(dir,name));
}
const database = JSON.parse(privateFile('dashboards.json').toString('utf8'));
const passwords = JSON.parse(privateFile('password-hashes.json').toString('utf8'));
const resumeDir = process.env.GTM_RESUME_DIR || privateDir;
const configuredOrigins = (process.env.GTM_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const port = Number(process.env.PORT || 4173);
const bind = process.env.HOST || '127.0.0.1';
const sessions = new Map();
const attempts = new Map();
const sessionLifetime = 8 * 60 * 60 * 1000;
const windowMs = 15 * 60 * 1000;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  const local = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  return [...local, ...configuredOrigins].includes(origin) ? origin : null;
}
function headers(req, res, status, type) {
  const origin = allowedOrigin(req);
  res.writeHead(status, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private', 'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' " + configuredOrigins.join(' ') + "; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    ...(origin ? {'Access-Control-Allow-Origin':origin, 'Vary':'Origin', 'Access-Control-Allow-Headers':'Authorization, Content-Type', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS'} : {})
  });
}
function reply(req,res,status,body) { headers(req,res,status); res.end(JSON.stringify(body)); }
function validSession(req, slug) {
  const m = /^Bearer ([A-Za-z0-9_-]+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const session = sessions.get(m[1]);
  if (!session || session.expires <= Date.now()) { sessions.delete(m[1]); return false; }
  return session.slug === slug;
}
function body(req) {
  return new Promise((resolve,reject) => {
    let raw = '';
    req.on('data', part => { raw += part; if (Buffer.byteLength(raw) > 2048) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch (_) { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}
async function checkPassword(input, rec) {
  if (typeof input !== 'string' || input.length > 128 || !rec) return false;
  const actual = await scrypt(input, Buffer.from(rec.salt, 'hex'), 64, {N:16384,r:8,p:1});
  const expected = Buffer.from(rec.hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function staticFile(req,res,url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(req,res,405,{error:'Method not allowed'});
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (_) { return reply(req,res,400,{error:'Bad path'}); }
  if (pathname.includes('\0') || pathname.split('/').includes('..')) return reply(req,res,400,{error:'Bad path'});
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (/^\/(clay|modal|decagon|baseten|hearth|watershed|august|siro|dualentry|langchain)$/.test(pathname)) pathname += '/index.html';
  const resolved = path.resolve(root, '.' + pathname);
  if (!resolved.startsWith(root + path.sep) || pathname.startsWith('/gtm-server/') || pathname.startsWith('/.git')) return reply(req,res,404,{error:'Not found'});
  fs.readFile(resolved, (err, data) => {
    if (err) return reply(req,res,404,{error:'Not found'});
    headers(req,res,200,mime[path.extname(resolved).toLowerCase()] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) {
    if (process.env.GTM_API_ONLY === '1') return reply(req,res,404,{error:'Not found'});
    return staticFile(req,res,url);
  }
  if (req.headers.origin && !allowedOrigin(req)) return reply(req,res,403,{error:'Origin not allowed'});
  if (req.method === 'OPTIONS') { headers(req,res,204); return res.end(); }
  if (url.pathname === '/api/session' && req.method === 'POST') {
    let input;
    try { input = await body(req); } catch (_) { return reply(req,res,400,{error:'Invalid request'}); }
    const slug = typeof input.company === 'string' ? input.company : '';
    // Reject unknown slugs before allocating rate-limit state; otherwise an
    // unauthenticated client could create an unbounded number of buckets.
    if (!Object.hasOwn(database,slug)) return reply(req,res,401,{error:'Incorrect password.'});
    const ip = req.socket.remoteAddress || 'unknown';
    const key = ip + ':' + slug;
    const now = Date.now();
    const previous = (attempts.get(key) || []).filter(t => now - t < windowMs);
    if (previous.length >= 8) return reply(req,res,429,{error:'Too many attempts. Try again later.'});
    previous.push(now); attempts.set(key,previous);
    try {
      if (!await checkPassword(input.password,passwords[slug])) return reply(req,res,401,{error:'Incorrect password.'});
      attempts.delete(key);
      const token = crypto.randomBytes(32).toString('base64url');
      sessions.set(token,{slug,expires:now + sessionLifetime});
      return reply(req,res,200,{token});
    } catch (_) { return reply(req,res,500,{error:'Access unavailable.'}); }
  }
  const match = /^\/api\/([a-z]+)\/(dashboard|resume|logout)$/.exec(url.pathname);
  if (!match || !Object.hasOwn(database,match[1])) return reply(req,res,404,{error:'Not found'});
  const [,slug,resource] = match;
  if (!validSession(req,slug)) return reply(req,res,401,{error:'Please sign in again.'});
  if (resource === 'dashboard' && req.method === 'GET') return reply(req,res,200,database[slug]);
  if (resource === 'logout' && req.method === 'POST') { sessions.delete(req.headers.authorization.slice(7)); return reply(req,res,200,{ok:true}); }
  if (resource === 'resume' && req.method === 'GET') {
    const kind = url.searchParams.get('format');
    if (kind !== 'pdf' && kind !== 'docx') return reply(req,res,400,{error:'Invalid format'});
    const filename = database[slug].resume[kind];
    if (typeof filename !== 'string' || path.basename(filename) !== filename) return reply(req,res,500,{error:'Resume unavailable'});
    try {
      const data = privateFile(filename,resumeDir);
      headers(req,res,200,kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.end(data);
      return;
    } catch (_) { return reply(req,res,404,{error:'Resume unavailable'}); }
  }
  return reply(req,res,405,{error:'Method not allowed'});
});
server.listen(port,bind,() => console.log(`GTM preview listening on http://${bind}:${port}`));
setInterval(() => {
  const now = Date.now();
  for (const [key,s] of sessions) if (s.expires <= now) sessions.delete(key);
  for (const [key,items] of attempts) if (!items.some(t => now - t < windowMs)) attempts.delete(key);
}, 60_000).unref();
