# Hans Anuta Portfolio

Minimal React + Vite foundation for a future portfolio. The React app intentionally
renders a blank page; portfolio content and design have not been built yet.
Node.js powers the tooling and optional static server. No PHP is used.

## Local development

Install Node.js 22.x (which includes npm), then run from the project folder:

```sh
npm ci
npm run dev
```

To check the production build locally:

```sh
npm run build
npm start
```

`npm start` serves the built `dist` directory, supports React client-side routes,
and uses the `PORT` environment variable when set (otherwise port 3000).
Build the project before starting it. `npm run preview` is also available for
local build previews.

## Connect Hostinger to GitHub

In Hostinger's Node.js Web App setup, select **Import Git Repository** and
authorize the Hostinger GitHub app to access:

https://github.com/ItsHansAnuta/Portfolio-HansAnuta

Use these settings:

| Setting | Value |
| --- | --- |
| Repository | `ItsHansAnuta/Portfolio-HansAnuta` |
| Branch | `main` |
| Root directory | Repository root (`.`) |
| Framework | React / Vite (frontend application) |
| Node.js version | 22.x |
| Install command (if shown) | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Start command (if requested) | `npm start` |

Hostinger's frontend deployment serves `dist` directly; it does not need a
persistent Node.js server. The valid `start` script is included for compatibility
and for serving the build locally.

Deploy once and enable **automatic deployment** for `main` in Hostinger.
Future pushes to `main` will then trigger a build and deployment.
Connecting the repository and authorizing Hostinger must be completed in your
Hostinger/GitHub account; adding project files alone does not enable deployment.

If the repository/branch error persists, refresh the repository list, select
`main`, and confirm that the Hostinger GitHub app has access to this repository.

## Upload future changes

From this project folder, review and upload your changes:

```sh
git status
git diff
git add <changed-files>
git commit -m "Describe your changes"
git push origin main
```

Local file saves are uploaded only after committing and pushing. Dependencies,
generated build output, and local environment files are excluded from Git.
Hostinger installs dependencies and builds from the committed source.
