# Hansifies IT

Hans Anuta's portfolio and personal editorial journal at **https://hansifies.io**.
React + Vite frontend, Node.js / Express server, and MySQL / MariaDB publishing
storage. No PHP.

## What's included

- Real pages: Home, The person, The craft, Editorials, and Say hello.
- An interactive home desk with movable cards and working UI experiments.
- A staggered editorial feed with category filters and full-text search.
- A seamless article reader: opens over the collection, preserves its position,
  closes with Back / Escape, and supports shareable URLs and browser history.
- An owner-only dashboard at `/dashboard`: image uploads, titles, introductions,
  categories, paragraph blocks, pull quotes, highlighted statements, preview,
  drafts, publishing, editing, unpublishing, and deletion.
- Server-rendered public articles and live sitemap updates immediately after
  publishing. New posts do not require a GitHub push or rebuild.

## Hostinger setup (required for live publishing)

The previous site was a static frontend. **The publishing version must run as a
Node.js web app**, since a static deployment cannot sign you in, upload images,
or write to the database.

Use Hostinger's Node.js / Express web app deployment, connected to:

| Setting | Value |
| --- | --- |
| Repository | `ItsHansAnuta/Portfolio-HansAnuta` |
| Branch | `main` |
| Root | Repository root |
| Runtime | Node.js 22.x, current patch release |
| Install | `npm ci` |
| Build | `npm run build` |
| Start | `npm start` |
| Entry file, if requested | `server/index.mjs` |
| Domain | `hansifies.io` |

Do not deploy only `dist` as a static frontend. The running app needs `server/`,
`src/content.js`, `src/editorials/model.js`, production dependencies, `dist/`,
and `dist-ssr/`. The server uses Hostinger's `PORT` environment variable.

Set these **server-side environment variables** in Hostinger:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://hansifies.io` |
| `DB_HOST` | Database hostname from Hostinger; `localhost` only if supported for this Node app |
| `DB_PORT` | `3306`, unless Hostinger specifies another port |
| `DB_NAME` | `u533823530_hansifies` |
| `DB_USER` | `u533823530_HansAnuta` |
| `DB_PASSWORD` | Your database password, entered privately in Hostinger |
| `DB_SSL` | `true` if the database provider requires verified TLS; otherwise `false` |
| `ADMIN_PASSWORD_HASH` | Generated below |
| `SESSION_SECRET` | Generated below |

Generate **separate dashboard credentials** locally:

```sh
npm run admin:credentials
```

Save the displayed dashboard password in your password manager. Paste the
generated hash and session secret into Hostinger's environment settings, then
restart/redeploy the Node app. Open **https://hansifies.io/dashboard** and sign
in using the generated dashboard password, not the database password.

The app creates only its own tables: `hansifies_posts`, `hansifies_images`, and
`hansifies_settings`. It seeds the two existing studio notes once. Drafts, posts,
and original image files are stored in MySQL, so redeploying source code does not
erase them. Include these tables in database backups. Existing unrelated tables
are not modified.

Missing database or dashboard settings show a setup message; public starter pages
remain readable. A configured but unreachable database fails startup, so check
the Hostinger application logs and database hostname/network access if needed.

## Local development

Use Node.js 22.x. Install dependencies:

```sh
npm ci
```

Copy `.env.example` to an untracked `.env` and fill in your local database and
dashboard settings. Never use `VITE_` prefixes for secrets: those are frontend
variables. The production database does not need to be exposed to your local PC;
you can use a separate local MySQL database for development.

Run these in two terminals:

```sh
npm run dev:server
```

```sh
npm run dev
```

Open Vite's URL. It proxies `/api` and `/uploads` to the Node server on port 3000.
Keep `PORT=3000` locally or update the Vite proxy target if you change it.

To verify the production site locally:

```sh
npm run build
npm start
```

Open `http://localhost:3000`. `npm run preview` previews only static frontend
output; use the Node server to test login and publishing.

On Windows PowerShell with script execution restricted, use `npm.cmd` in place
of `npm`.

## Publishing workflow

1. Open `/dashboard` and sign in.
2. Choose **Write a new entry** and add a title and category.
3. Optionally upload a cover (JPG, PNG, WebP, or GIF; up to 8 MB) and describe it.
4. Write paragraph blocks. Change a block to **Pull quote** or **Highlighted
   statement** to make that passage stand out. Reorder blocks with the arrows.
5. Preview the entry, save a draft, or publish it directly.
6. To edit, select the entry in the sidebar. Its URL remains stable when the title
   changes. **Move to drafts** removes it from the public feed; Delete removes it.

There is no automatic draft saving. A status indicator shows unsaved changes;
save before leaving the editor. Images are saved when uploaded; posts become
public only when published. The site does not interpret raw HTML in post bodies.

The dashboard uses signed, HTTP-only, same-site cookies, origin-checked writes,
login attempt limits, and server-side validation. Changing the dashboard password
hash or session secret invalidates existing sessions. Sessions last eight hours.

## Updating the portfolio

Profile/contact links, portrait, skills, and project cards live in
`src/content.js`. Published editorials live in the database and are managed from
the dashboard. The `notes` array supplies the initial studio notes only; it does
not overwrite database content after initialization.

Put your portrait in `public/images/` and set `profile.portrait` to its path. It
inherits the interactive identity card. Empty `projects` hides the projects
section. Instagram currently displays Donovan Galager; its link appears once
`profile.instagramUrl` is supplied.

## Code map

- `src/App.jsx`: application navigation and interactive home desk.
- `src/PortfolioPages.jsx`: person, craft, and contact pages.
- `src/editorials/Editorials.jsx`: feed and focused article reader.
- `src/editorials/Dashboard.jsx`: owner editor and dashboard.
- `src/editorials/editorials.css`: navigation, journal, reader, and editor styles.
- `src/entry-server.jsx`: server rendering, metadata, and safe hydration data.
- `server/index.mjs`: Express API and live page/image delivery.
- `server/store.mjs`: MySQL storage, validation, and optimistic edit concurrency.
- `server/auth.mjs`: login, session signing, and login rate limits.

Fonts use Google Fonts with system fallbacks. Motion respects reduced-motion
preferences. Old `/notes/:slug` URLs redirect to `/editorials/:slug` on the server.

## Tests

```sh
npm test
```

Authentication and validation tests run without a database. Integration tests
also exercise the actual MySQL API when `TEST_DB_HOST`, `TEST_DB_NAME`,
`TEST_DB_USER`, and `TEST_DB_PASSWORD` are set. Use a separate, disposable
database named `hansifies_test_*`; these tests create and remove test entries.
Run `npm run build` before the integration tests to also test live server rendering.

## Deployment

Review changes, commit the intended source files, and push to `main` to trigger
Hostinger's connected deployment. Database credentials and `.env` files never
belong in Git. Generated `dist`, `dist-ssr`, and dependencies are ignored.
