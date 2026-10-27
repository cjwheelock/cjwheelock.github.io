# Free protected portfolio API

This Worker is an alternative to the local Node preview in `gtm-server`. GitHub Pages continues to serve the public interface. The Worker checks the individual company passwords, while a private Workers KV namespace stores the dashboard data and resume files. Durable Objects store short-lived sessions and keep rate limits consistent. Nothing sensitive belongs in the GitHub Pages repository.

The design targets Cloudflare's Workers Free plan, without a paid plan or R2. Its limits apply and requests fail when free quotas are exhausted; verify the account is on the Free plan before any release. The current passwords have a company-specific prefix and a randomly generated 60-bit suffix. Their keyed verifiers and a separate random pepper are Worker secrets, not source files. Changing password generation to human-chosen or lower-entropy passwords requires a slow password KDF and a reassessment of Worker CPU limits.

## Local preparation

```sh
node gtm-cloudflare/prepare-private.cjs /absolute/path/to/private /absolute/path/to/resumes
```

This reads the existing company passwords from the Mac login Keychain and creates a private `cloudflare/` directory containing separate content files and `secrets.json`. It refuses to overwrite a prior preparation. Never commit or publish those files. They are not the public GitHub Pages content.

The API is intentionally not deployed. Before release, an authorized operator must:

1. Confirm a Cloudflare account on the Free plan, create a private KV namespace, and set its ID in `wrangler.toml`. No DNS changes are needed; use the Worker's `workers.dev` address.
2. Upload the three private files per company as KV keys: `<slug>/dashboard`, `<slug>/resume/pdf`, and `<slug>/resume/docx`. Use `wrangler kv key put --remote --binding PORTFOLIO_DATA --path <private-file> <key>`; never put the files in the GitHub repository.
3. Deploy the Worker with the two values in private `secrets.json` as Worker secrets. The `--secrets-file` option can supply them at deployment; do not commit, log, or expose the file. Set the exact public website origins in `ALLOWED_ORIGINS`.
4. Set `gtm/config.js` to the Worker's HTTPS origin, release the public GitHub Pages shell only after explicit production approval, and test all ten passwords, denial across companies, protected downloads, sign-out, and the original Trunk Tools experience.

KV updates may take time to propagate. Sessions, rate-limit state, and sign-out do not use KV; they use the per-company Durable Object. The Worker fails closed on service or quota errors. It must not be configured to bypass authentication if a resource fails.
