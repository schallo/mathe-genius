# GitHub & Claude Code on the Web – Setup

How to put Zahlenhausen on GitHub, publish it with GitHub Pages and work on it with Claude Code in the browser (claude.ai/code).

> Button names on GitHub and claude.ai may differ slightly from this description. The steps stay the same.

## Status (as of 2026-10-21)

- [x] Email privacy enabled on GitHub (_Keep my email addresses private_ + _Block command line pushes that expose my email_)
- [x] Git identity set (noreply address)
- [x] Repo `schallo/mathe-genius` created (public)
- [x] Local project pushed (`main` tracks `origin/main`)
- [x] Pages source set to _GitHub Actions_, first deploy green, game live at https://schallo.github.io/mathe-genius/
- [ ] Game added to the iPhone home screen
- [ ] Claude GitHub App installed for `mathe-genius` only
- [ ] Cloud environment with setup script
- [ ] First web session started

## 1. Set your git identity (once per PC)

First, on GitHub under **Settings → Emails**:

1. Turn on **Keep my email addresses private**.
2. Turn on **Block command line pushes that expose my email** (appears after step 1).
3. Note the noreply address shown there: `18176675+schallo@users.noreply.github.com`.

Then on the PC:

```
git config --global user.name "schallo"
git config --global user.email "18176675+schallo@users.noreply.github.com"
```

- `user.name` is only the display name on commits (free text).
- `user.email` links commits to your GitHub profile. Use the noreply address: the repo is public, and with the push block on, GitHub **rejects** pushes containing commits with your private address.
- If commits were already made with a different address, fix the last one before pushing:
  ```
  git commit --amend --reset-author --no-edit
  ```
  (`fatal: You have nothing to amend` just means there are no commits yet, so nothing to fix.)

## 2. Create the repository on GitHub

1. Open **https://github.com/new**.
2. Owner: `schallo`, name: `mathe-genius`.
3. Visibility: **Public** (GitHub Pages is free only for public repos; private repos need GitHub Pro).
4. **Don't** add a README, `.gitignore` or license, because the local project already has them.
5. Click **Create repository**.

## 3. Push the local project

```
cd C:\Repos\mathe-genius
git add -A
git commit -m "Set up workspace"
git branch -M main
git remote add origin https://github.com/schallo/mathe-genius.git
git push -u origin main
```

- `git add -A` makes sure all files are in the first commit.
- `git branch -M main` renames the branch in case Git created it as `master` locally; otherwise the push to `main` fails.
- On the first push, Git for Windows opens a browser window for the GitHub login.

## 4. Turn on GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment**.
2. Source: **GitHub Actions** (saved immediately when chosen from the dropdown, no _Save_ button).
3. Every push to `main` now runs tests + build (`.github/workflows/deploy.yml`) and publishes the game to:
   **https://schallo.github.io/mathe-genius/**
4. Check progress under the repo's **Actions** tab.

> **Note:** The push in step 3 already triggers the workflow, before Pages is enabled. That first run fails in the deploy step (`Failed to create deployment (status: 404) … Ensure GitHub Pages has been enabled`) even though tests pass. After switching the source, open the run in **Actions** → **Re-run jobs → Re-run all jobs**, or just push the next commit.

### Install on the iPhone

1. Open the address above in **Safari**.
2. **Teilen → Zum Home-Bildschirm**.
3. The game then starts full screen like an app and also works offline.

## 5. Connect Claude to GitHub

1. Open **https://claude.ai/code** and sign in.
2. Connect GitHub when asked. This installs the **Claude GitHub App**.
3. Repository access: **Only select repositories → `mathe-genius`**.

To change access later: GitHub **Settings → Applications → Installed GitHub Apps → Claude → Configure**.

## 6. Configure the cloud environment

In claude.ai/code, create or edit the environment used for this repo.

**Network access:** the default (restricted) access normally allows npm. Playwright downloads its test browsers from its own servers, which may be blocked. If the e2e tests can't run, allow that domain or choose full network access.

**Setup script** (runs at the start of every session):

```
npm ci
npx playwright install --with-deps chromium webkit
```

## 7. Working with Claude in the browser

1. Start a session and select the repo `mathe-genius`.
2. Claude automatically loads `CLAUDE.md`, `docs/GAME_DESIGN.md`, `docs/STYLE_GUIDE.md`, `.claude/settings.json` and the skills (`/playtest`, `/new-topic`), just as it does locally.
3. Give it the next task, e.g. _"Start build step 1"_.
4. Claude works on its **own branch** and opens a **pull request**.
5. Review the pull request on GitHub (changes, screenshots, test results) and click **Merge**.
6. Merging to `main` triggers the deploy. A minute later, the new version is live on GitHub Pages and on her iPhone.

### Local vs. web

|                         | Local (VS Code)                                   | Web (claude.ai/code)                  |
| ----------------------- | ------------------------------------------------- | ------------------------------------- |
| Where code changes land | Commit directly on `main`                         | Branch + pull request, you merge      |
| Test on iPhone          | `npm run dev`, open the Network URL in your Wi-Fi | After merge: GitHub Pages URL         |
| Visual checks           | Playwright screenshots                            | Playwright screenshots (needs step 6) |

To switch between the two, always start from an up-to-date `main`:

```
git pull
```

## Known warnings in the workflow (not blocking)

- ~~_Node.js 20 is deprecated_~~ – fixed 2026-10-21: actions bumped to `checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`. If a future warning appears, check the latest tags on github.com/actions and bump the major versions in `.github/workflows/deploy.yml`.
- _ubuntu-latest migrates to Ubuntu 26_ (from 2026-10-19). Watch the first runs after the switch.
