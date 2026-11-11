# Hans Anuta Portfolio

An interactive, personal portfolio for **Hansifies IT / Hans Anuta**, built with
React and Vite. Includes a draggable desktop, a reversible pointer-responsive
identity card, interactive app previews, and a filterable notebook. Responsive
layouts, keyboard controls, and reduced-motion support are included.

Node.js powers the tooling and optional static server. No PHP is used.

## Updating your site

Edit **`src/content.js`**. No component edits are needed to:

- Set your name, email, GitHub, and Instagram URL. Instagram's display name is
  currently Donovan Galager; its link appears when you provide the URL.
- Add your real portrait: put the image in `public/images/`, then set `portrait`
  to `/images/your-photo.webp`. It inherits the interactive tilt/flip treatment.
- Set `siteUrl` to your final production domain, such as `https://yourdomain.com`.
  Builds then generate canonical URLs, Open Graph URLs, and a sitemap.
- Add projects to `projects` using the documented example. Only entries with
  `published: true` appear. An empty collection hides the entire project section.
- Add notebook entries with a unique lowercase hyphenated `id`, category, label,
  title, excerpt, an array of body paragraphs, and `published: true`. Each entry
  gets its own pre-rendered page at `/notes/your-id/`. Keep IDs stable after publishing.

The two initial notebook entries explain this site's design; replace or expand
them with your actual writing, career stories, hobbies, and project notes.
Never put private information in the content file, including unpublished drafts:
this is a public frontend bundle. `published` controls visibility, not privacy.

**Search visibility:** `npm run build` generates complete HTML for the homepage
and published notes, individual page metadata, and structured data. Crawlers can
read the content without running JavaScript. Set your domain before production
to finish canonical/sitemap setup. The base homepage metadata is in `index.html`;
the pre-render build maintains the per-page metadata. When you change the site's
description, update it in `index.html` and `scripts/prerender.mjs` together.

**Design:** `src/styles.css` holds the responsive styles and color tokens.
`src/App.jsx` holds the interactive components. Fonts load from Google Fonts,
with local system fallbacks. No animation libraries or external UI kits are required.

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
