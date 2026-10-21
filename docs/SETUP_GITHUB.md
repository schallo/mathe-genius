# GitHub & Claude Code on the Web – Setup

How to put Mathe-Bühne on GitHub, publish it with GitHub Pages and work on it with Claude Code in the browser (claude.ai/code).

> Button names on GitHub and claude.ai may differ slightly from this description. The steps stay the same.

## 1. Set your git identity (once per PC)

```
git config --global user.name "schallo"
git config --global user.email "<your GitHub email or noreply address>"
```

- `user.name` is only the display name on commits (free text).
- `user.email` links commits to your GitHub profile. It must be an email registered in your GitHub account (_Settings → Emails_).
- The repo is public, so commits show this email. To keep your private address hidden, enable _Keep my email addresses private_ and use the shown address, e.g. `12345678+schallo@users.noreply.github.com`.

## 2. Create the repository on GitHub

1. Open **https://github.com/new**.
2. Owner: `schallo`, name: `mathe-genius`.
3. Visibility: **Public** (GitHub Pages is free only for public repos; private repos need GitHub Pro).
4. **Don't** add a README, `.gitignore` or license, because the local project already has them.
5. Click **Create repository**.

## 3. Push the local project

```
cd C:\Repos\mathe-genius
git commit -m "Set up workspace"
git remote add origin https://github.com/schallo/mathe-genius.git
git push -u origin main
```

On the first push, Git for Windows opens a browser window for the GitHub login.

## 4. Turn on GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment**.
2. Source: **GitHub Actions**.
3. Every push to `main` now runs tests + build (`.github/workflows/deploy.yml`) and publishes the game to:
   **https://schallo.github.io/mathe-genius/**
4. Check progress under the repo's **Actions** tab.

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

## Checklist

- [ ] Git identity set
- [ ] Repo `schallo/mathe-genius` created (public)
- [ ] Local project pushed
- [ ] Pages source set to _GitHub Actions_, first deploy green
- [ ] Game added to the iPhone home screen
- [ ] Claude GitHub App installed for `mathe-genius` only
- [ ] Cloud environment with setup script
- [ ] First web session started
