# Company GTM workspaces

The ten company routes use the established Trunk Tools visual system and a shared static application. Company-specific content lives in each route's `portfolio.json`: role priorities, synthetic account records, outreach playbooks, experiments, first builds and candidate positioning. `resume-projects.html` retains the three approved project stories from the Trunk Tools page; each company supplies its own relevance notes.

Each workspace has twelve persistent views, an account-evidence dialog, a distinct company workflow, local review state and a prepared-answer copilot. Switching views keeps the application shell mounted. The copilot and agent walkthroughs do not call a live model. No CRM, provider or outbound account is connected. Operating data and experiment results are labeled synthetic; company references and personal project evidence are treated separately.

The site remains buildless on GitHub Pages. The existing company passwords and browser-side courtesy gates are retained. This gate does not secure static JSON or résumé downloads; anyone who finds the underlying URL or repository can access them. Verifier hashes are in `gate-hashes.js`; plaintext passwords are kept in the Mac login Keychain, service `CJWheelock GTM portfolio 2026-10`, account = lowercase company slug.

Local preview: run `python3 -m http.server 4376 --bind 127.0.0.1` from the repository root, then open `http://127.0.0.1:4376/clay/` or another company route. Authentication and local workflow state use company-specific session-storage keys. Successful explicit password entry calls the optional `recordGTMAccess` hook; no delivery implementation or email notification is enabled by these files.

The homepage and original `trunktools/` files are preserved. Production is the repository's `main` branch at `/`, with the existing custom domain; publishing commits requires the user's scoped release authorization.
