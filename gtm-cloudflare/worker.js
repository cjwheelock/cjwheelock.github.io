/* Protected portfolio API for the Cloudflare Workers Free plan.
 * Private dashboards and resumes are in a KV namespace, never in GitHub Pages.
 * Durable Objects keep company-bound sessions and rate limits consistent.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const companies = new Set(['clay', 'modal', 'decagon', 'baseten', 'hearth',
  'watershed', 'august', 'siro', 'dualentry', 'langchain']);
const lifetime = 8 * 60 * 60 * 1000;
const windowMs = 15 * 60 * 1000;
const digest = value => createHash('sha256').update(value).digest('hex');
const passwordDigest = (pepper, slug, password) =>
  createHmac('sha256', pepper).update(`gtm-portfolio:${slug}:${password}`).digest('hex');

function result(status, value) {
  return new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json; charset=utf-8'}});
}

// One instance per company ensures login attempts and sessions are isolated.
export class CompanyAccess {
  constructor(state, env) { this.state = state; this.env = env; }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    const input = await request.json();
    if (!companies.has(input.slug)) return result(404, {error: 'Not found'});

    if (path === '/login') {
      if (typeof input.password !== 'string' || input.password.length > 128) {
        return result(401, {error: 'Incorrect password.'});
      }
      let expected;
      try {
        const records = JSON.parse(this.env.PASSWORD_DIGESTS);
        expected = records[input.slug];
      } catch (_) { return result(503, {error: 'Access unavailable.'}); }
      if (!this.env.PASSWORD_PEPPER || !/^[a-f0-9]{64}$/.test(expected || '')) {
        return result(503, {error: 'Access unavailable.'});
      }
      const candidate = passwordDigest(this.env.PASSWORD_PEPPER, input.slug, input.password);
      const matched = timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(expected, 'hex'));
      const token = randomBytes(32).toString('base64url');
      const tokenKey = digest(token);
      const ipKey = digest(input.ip || 'unknown');
      const now = Date.now();

      // Keep each check and update atomic across simultaneous requests and locations.
      const outcome = await this.state.storage.transaction(async tx => {
        const rates = (await tx.get('rates')) || {all: [], ips: {}};
        rates.all = rates.all.filter(t => now - t < windowMs);
        for (const [ip, times] of Object.entries(rates.ips)) {
          rates.ips[ip] = times.filter(t => now - t < windowMs);
          if (!rates.ips[ip].length) delete rates.ips[ip];
        }
        const individual = rates.ips[ipKey] || [];
        if (individual.length >= 8 || rates.all.length >= 40) return 'limited';
        rates.all.push(now);
        individual.push(now);
        rates.ips[ipKey] = individual;
        if (matched) delete rates.ips[ipKey];
        await tx.put('rates', rates);
        if (!matched) return 'incorrect';

        const sessions = (await tx.get('sessions')) || {};
        for (const [key, expires] of Object.entries(sessions)) {
          if (expires <= now) delete sessions[key];
        }
        // Limit stored state even if legitimate credentials are repeatedly used.
        if (Object.keys(sessions).length >= 100) {
          const oldest = Object.keys(sessions).sort((a, b) => sessions[a] - sessions[b])[0];
          delete sessions[oldest];
        }
        sessions[tokenKey] = now + lifetime;
        await tx.put('sessions', sessions);
        return 'ok';
      });
      if (outcome === 'limited') return result(429, {error: 'Too many attempts. Try again later.'});
      if (outcome !== 'ok') return result(401, {error: 'Incorrect password.'});
      return result(200, {token});
    }

    if (path === '/session' || path === '/logout') {
      if (typeof input.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) {
        return result(401, {error: 'Please sign in again.'});
      }
      const key = digest(input.token);
      const valid = await this.state.storage.transaction(async tx => {
        const sessions = (await tx.get('sessions')) || {};
        const active = Number(sessions[key]) > Date.now();
        if (path === '/logout' || (sessions[key] && !active)) {
          delete sessions[key];
          await tx.put('sessions', sessions);
        }
        return active;
      });
      return valid ? result(200, {ok: true}) : result(401, {error: 'Please sign in again.'});
    }
    return result(404, {error: 'Not found'});
  }
}

async function bodyWithinLimit(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty body');
  const chunks = [];
  let length = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 2048) { await reader.cancel(); throw new Error('Body too large'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function decorate(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, private');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Vary', 'Origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  return new Response(response.body, {status: response.status, headers});
}

async function access(env, slug, action, payload) {
  const id = env.ACCESS.idFromName(slug);
  return env.ACCESS.get(id).fetch(`https://access.internal/${action}`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({slug, ...payload})
  });
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/session' && request.method === 'POST') {
    let input;
    try { input = await bodyWithinLimit(request); }
    catch (_) { return result(400, {error: 'Invalid request'}); }
    const slug = typeof input?.company === 'string' ? input.company : '';
    if (!companies.has(slug)) return result(401, {error: 'Incorrect password.'});
    return access(env, slug, 'login', {password: input.password, ip: request.headers.get('CF-Connecting-IP') || 'unknown'});
  }
  const match = /^\/api\/([a-z]+)\/(dashboard|resume|logout)$/.exec(url.pathname);
  if (!match || !companies.has(match[1])) return result(404, {error: 'Not found'});
  const [, slug, resource] = match;
  if ((resource === 'logout' && request.method !== 'POST') ||
      (resource !== 'logout' && request.method !== 'GET')) return result(405, {error: 'Method not allowed'});
  const auth = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization') || '');
  if (!auth) return result(401, {error: 'Please sign in again.'});
  const authorization = await access(env, slug, resource === 'logout' ? 'logout' : 'session', {token: auth[1]});
  if (!authorization.ok || resource === 'logout') return authorization;

  if (resource === 'dashboard') {
    const data = await env.PORTFOLIO_DATA.get(`${slug}/dashboard`, 'arrayBuffer');
    if (!data) return result(404, {error: 'Access unavailable.'});
    return new Response(data, {headers: {'Content-Type': 'application/json; charset=utf-8'}});
  }
  const kind = url.searchParams.get('format');
  if (kind !== 'pdf' && kind !== 'docx') return result(400, {error: 'Invalid format'});
  const data = await env.PORTFOLIO_DATA.get(`${slug}/resume/${kind}`, 'arrayBuffer');
  if (!data) return result(404, {error: 'Resume unavailable'});
  return new Response(data, {headers: {'Content-Type': kind === 'pdf' ? 'application/pdf' :
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}});
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const origins = (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
    if (origin && !origins.includes(origin)) return decorate(result(403, {error: 'Origin not allowed'}), null);
    if (request.method === 'OPTIONS') return decorate(new Response(null, {status: 204}), origin);
    try { return decorate(await handle(request, env), origin); }
    catch (_) { return decorate(result(503, {error: 'Access unavailable.'}), origin); }
  }
};
