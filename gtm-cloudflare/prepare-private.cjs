/* Prepare local-only Cloudflare data and secrets. Nothing here is uploaded. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');

const [privateDir, resumeDir] = process.argv.slice(2);
if (!privateDir || !resumeDir) throw new Error('Usage: node prepare-private.cjs PRIVATE_DIR RESUME_DIR');
const destination = path.join(path.resolve(privateDir), 'cloudflare');
if (fs.existsSync(destination)) throw new Error('Private Cloudflare output already exists; refusing to overwrite it.');
const database = JSON.parse(fs.readFileSync(path.join(privateDir, 'dashboards.json'), 'utf8'));
const slugs = ['clay','modal','decagon','baseten','hearth','watershed','august','siro','dualentry','langchain'];
const pepper = crypto.randomBytes(32).toString('base64url');
const records = {};
const files = [];
for (const slug of slugs) {
  if (!database[slug]) throw new Error(`Missing dashboard: ${slug}`);
  const password = execFileSync('security', ['find-generic-password', '-s', 'CJWheelock GTM portfolio 2026-10', '-a', slug, '-w'], {encoding:'utf8'}).trim();
  const generatedFormat = new RegExp(`^${slug.toUpperCase()}-LETSBUILD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$`);
  if (!generatedFormat.test(password)) throw new Error(`Password for ${slug} is not in the generated high-entropy format.`);
  // These generated company passwords have a 60-bit random suffix. A keyed
  // digest avoids expensive password stretching on the Free plan while
  // protecting the verifier with a separate server-side secret.
  records[slug] = crypto.createHmac('sha256', pepper).update(`gtm-portfolio:${slug}:${password}`).digest('hex');
  files.push([`${slug}-dashboard.json`, Buffer.from(JSON.stringify(database[slug]))]);
  for (const kind of ['pdf','docx']) {
    const filename = database[slug].resume[kind];
    if (path.basename(filename) !== filename) throw new Error(`Invalid resume filename: ${slug}`);
    files.push([`${slug}-resume.${kind}`, fs.readFileSync(path.join(resumeDir, filename))]);
  }
}
fs.mkdirSync(destination, {mode:0o700});
for (const [filename, data] of files) fs.writeFileSync(path.join(destination, filename), data, {mode:0o600, flag:'wx'});
const secrets = {PASSWORD_PEPPER: pepper, PASSWORD_DIGESTS: JSON.stringify(records)};
fs.writeFileSync(path.join(destination, 'secrets.json'), JSON.stringify(secrets), {mode:0o600, flag:'wx'});
console.log(`Prepared ${files.length} private files and local-only Worker secrets.`);
