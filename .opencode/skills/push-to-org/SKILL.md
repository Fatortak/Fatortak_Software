---
name: push-to-org
description: Push Fatortak code, branches and releases to the Fatortak GitHub organization safely, with secret-safety, visibility and verification checks.
license: AGPL-3.0
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

# Push Fatortak to the GitHub organization

- Canonical repository: `https://github.com/Fatortak/Fatortak_Software`
- Organization: `https://github.com/Fatortak`
- Visibility policy: **public** (see [Visibility](#visibility)). Do not change it
  without an explicit owner decision.

The repository was transferred from `Ahmed-Nasser99/Fatortak_Software` on
2026-10-28. GitHub redirects the old URLs, but always use the canonical org URL
in new content.

## Daily workflow

1. Confirm the remote points at the organization:

   ```bash
   git remote -v
   git remote set-url origin https://github.com/Fatortak/Fatortak_Software.git
   git fetch origin
   ```

2. Never commit directly to `main`. Create a topic branch from `origin/main`:

   ```bash
   git switch -c feat/short-description origin/main
   ```

3. Stage only reviewed paths. Never run `git add -A` or `git add .` on a dirty
   tree:

   ```bash
   git add path/to/file another/file
   git diff --cached
   ```

4. Run the checks that match the change:

   ```bash
   dotnet build fatortak_backend/fatortak/fatortak.csproj
   cd fatortak_frontend && npm ci && npm run build
   ```

5. Commit with a Conventional Commit message and push:

   ```bash
   git commit -m "feat(scope): short description"
   git push -u origin HEAD
   ```

6. Open a pull request against `main`. Explain what changed, why, and how it was
   verified. Wait for all required checks: `Backend (.NET 8)`,
   `Frontend (React + Vite)`. Wait for all required checks.

7. Merges are **squash-only**; merge commits and rebase merges are disabled at
   the repository level. Branches are deleted automatically after merge.

## Secret safety

Run this before every push, not only before migrations:

```bash
git ls-files | rg -i '(^|/)(\.env|appsettings\.json|.*\.(pem|pfx|p12|key)|id_rsa|secret|credential)'
git grep -n -I -E 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|AccountKey=|SharedAccessKey='
gitleaks detect --no-git -v   # if installed
```

`fatortak_backend/fatortak/appsettings.json`, `.env`, `*.pfx`, `*.pem`,
`*.key` and local deploy files are ignored and must stay ignored. Never commit
them. If a secret is pushed, rotate it first; deleting the commit is not enough.

## Releases and tags

```bash
git tag -a v1.2.3 -m "v1.2.3"
git push origin v1.2.3
```

Create the GitHub release from the tag. Do not rewrite published tags.

## Visibility

Recommended and current: **public**.

- `LICENSE` is AGPL-3.0 and the README describes Fatortak as an
  "open-source business OS for MENA" with PRs and Discussions welcome.
- The code is already public; making the repository private now does not
  withdraw AGPL rights for versions that have already been published.
- Public repositories keep free branch protection, Pages and community
  contribution workflows.

Choose **private** only if the goal is proprietary distribution, paid-only
access or protection of customer data. In that case, change the license
deliberately, move secrets to the organization's secret store, and rotate any
credential that may ever have been exposed.

## If the project ever moves again

Prefer a **transfer** (Settings → General → Danger Zone → Transfer, or
`POST /repos/{owner}/{repo}/transfer`): it preserves issues, pull requests,
stars, watchers and redirects. A **mirror** (`git clone --mirror`, then
`git push --mirror`) keeps the old repository in place.

Before either:

```bash
git status --short
git bundle create ../fatortak-backup.bundle --all
```

After either, update the remote, verify `git ls-remote --heads --tags origin`,
open a test issue, confirm Actions runs, and update links in `README.md`,
`CONTRIBUTING.md`, `docs/` and badges.

## Repository settings to preserve

- Default branch: `main`
- Required checks: `Backend (.NET 8)`, `Frontend (React + Vite)`
- Squash merges only; branch auto-delete on merge
- Force pushes and branch deletion disabled on `main`
- Secret scanning, push protection, Dependabot alerts and security updates enabled
- Discussions enabled
