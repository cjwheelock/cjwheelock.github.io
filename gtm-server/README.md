# Protected portfolio API

This is a small Node 20+ API for the ten company portfolios. The GitHub Pages repository contains only the public login shell and shared UI. Company content, password hashes and resume files belong in a separate private bundle; never commit that bundle or plaintext passwords to this repository.

## Local preview

Run from the website repository with paths to the private data and resume directories:

```sh
GTM_PRIVATE_DIR=/absolute/path/to/private \
GTM_RESUME_DIR=/absolute/path/to/resumes \
PORT=4173 node gtm-server/server.js
```

Open `http://127.0.0.1:4173/clay/` or any of the other company routes. Passwords are stored in the Mac's login Keychain, with service `CJWheelock GTM portfolio 2026-10` and one account per company slug.

## Production arrangement to approve before use

GitHub Pages cannot run this API. Run one Node web service behind HTTPS on a separate host, with its private bundle supplied as a secret file. Configure:

- `HOST=0.0.0.0` and the host-provided `PORT`.
- `GTM_API_ONLY=1` so this service exposes only the protected API.
- `GTM_BUNDLE_PATH` to the absolute secret-file path.
- `GTM_ALLOWED_ORIGINS` to the exact public website origins, comma-separated.

Set `gtm/config.js` to that service's HTTPS origin only after it exists. Then deploy the public shell to GitHub Pages and test every route, password, cross-company denial, and resume download. The bundle must be uploaded only through the host's protected secret mechanism, not GitHub. The local bundle includes salted hashes, not plaintext passwords.

Sessions and rate limits live in process memory; use one service instance. Restarts invalidate sessions. The per-address rate limit uses the connection address without trusting spoofable forwarded headers; a reverse proxy may cause visitors to share a limit. Review the host's edge protections and availability before release. The existing Trunk Tools experience is outside this change.
