# Company portfolio pages

These pages run entirely as static files on GitHub Pages. Each company has a browser-side courtesy password gate, a `portfolio.json` data file and a `resume/` directory containing the matching PDF and Word document. The browser gate is not security: the static data and resume files are publicly accessible to anyone who finds their URLs or views the repository, just as with the Trunk Tools gate. No password-protected server or paid service is involved.

The company passwords are stored in the Mac login Keychain under the service `CJWheelock GTM portfolio 2026-10`, with the lowercase company slug as the account. `gate-hashes.js` contains only verifier hashes; do not commit the plaintext passwords. The public pages use no external API. `robots.txt` asks search crawlers not to index these company paths, but does not restrict access.

For a local preview, run a static server from the repository root, for example `python3 -m http.server 4375 --bind 127.0.0.1`, then open `http://127.0.0.1:4375/clay/`. GitHub Pages serves these same static files when the publishing branch is deployed. Deployment still requires CJ's explicit approval.
