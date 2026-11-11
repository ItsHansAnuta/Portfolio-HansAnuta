import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, validatePost } from './store.mjs';
import { makeAuth } from './auth.mjs';
import { profile } from '../src/content.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const production = process.env.NODE_ENV === 'production';
const store = await openStore();
const publicPosts = () => store ? store.published() : Promise.resolve([]);
const auth = makeAuth({ password: process.env.ADMIN_PASSWORD, passwordHash: process.env.ADMIN_PASSWORD_HASH, secret: process.env.SESSION_SECRET, production });
const app = express();
app.disable('x-powered-by');
// One trusted reverse proxy (Hostinger). Never trust an arbitrary client chain.
if (production) app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  if (req.path.startsWith('/dashboard')) res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const allowed = production ? new URL(process.env.SITE_URL || profile.siteUrl).origin : null;
  const origin = req.headers.origin;
  if (!origin || (allowed ? origin !== allowed : !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return res.status(403).json({ error: 'This request must come from your website.' });
  next();
});

app.get('/api/posts', async (req, res) => res.json({ posts: await publicPosts() }));
app.get('/api/posts/:slug', async (req, res) => {
  const post = (await publicPosts()).find(item => item.slug === req.params.slug);
  if (!post || post.status !== 'published') return res.status(404).json({ error: 'This entry is not available.' });
  res.json({ post });
});
app.get('/api/admin/session', (req, res) => res.json({ configured: auth.configured && Boolean(store), databaseConfigured: Boolean(store), authenticated: Boolean(store) && auth.authenticated(req) }));
app.use('/api/admin', (req, res, next) => store ? next() : res.status(503).json({ error: 'Connect the MySQL database in the server environment settings first.' }));
app.post('/api/admin/login', auth.login);
app.post('/api/admin/logout', auth.logout);
app.use('/api/admin', auth.require);
app.get('/api/admin/posts', async (req, res) => res.json({ posts: await store.all() }));

async function postInput(body) {
  const post = validatePost(body);
  if (post.cover) {
    if (!await store.image(post.cover.slice('/uploads/'.length))) { const error = new Error('This cover image is missing. Please upload it again.'); error.status = 400; throw error; }
  }
  return post;
}
app.post('/api/admin/posts', async (req, res) => res.status(201).json({ post: await store.save(await postInput(req.body)) }));
app.put('/api/admin/posts/:id', async (req, res) => {
  const existing = await store.byId(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Entry not found.' });
  // Optimistic concurrency prevents silently overwriting edits from another tab.
  if (req.body.updatedAt !== existing.updatedAt) return res.status(409).json({ error: 'This entry changed in another tab. Reopen it before saving.' });
  res.json({ post: await store.save(await postInput(req.body), existing) });
});
app.delete('/api/admin/posts/:id', async (req, res) => {
  if (!await store.byId(req.params.id)) return res.status(404).json({ error: 'Entry not found.' });
  await store.remove(req.params.id);
  res.json({ deleted: true });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 } });
app.post('/api/admin/uploads', upload.single('image'), async (req, res) => {
  const buffer = req.file?.buffer;
  if (!buffer) return res.status(400).json({ error: 'Choose an image first.' });
  const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const gif = ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString());
  const webp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  const extension = png ? 'png' : jpg ? 'jpg' : gif ? 'gif' : webp ? 'webp' : null;
  if (!extension) return res.status(400).json({ error: 'Use a JPG, PNG, WebP, or GIF image (up to 8 MB).' });
  const filename = `${randomUUID()}.${extension}`;
  await store.saveImage(filename, `image/${extension === 'jpg' ? 'jpeg' : extension}`, buffer);
  res.status(201).json({ url: `/uploads/${filename}` });
});
app.get('/uploads/:filename', async (req, res) => {
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(req.params.filename)) return res.sendStatus(404);
  const image = store && await store.image(req.params.filename);
  if (!image) return res.sendStatus(404);
  res.type(image.mime).set('Cache-Control', 'public, max-age=31536000, immutable').send(image.content);
});
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

const dist = resolve(root, 'dist');
let render;
let template;
try {
  ({ render } = await import('../dist-ssr/entry-server.js'));
  template = await readFile(resolve(dist, 'index.html'), 'utf8');
} catch {
  if (production) throw new Error('Build the website before starting the production server: npm run build');
}
app.get('/sitemap.xml', async (req, res) => {
  const base = process.env.SITE_URL || profile.siteUrl;
  const paths = ['/', '/contact', '/editorials', ...(await publicPosts()).map(post => `/editorials/${post.slug}`)];
  res.type('xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${base}${path}</loc></url>`).join('')}</urlset>`);
});
app.get('/notes/:slug', (req, res) => res.redirect(301, `/editorials/${encodeURIComponent(req.params.slug)}`));
app.get('/about', (req, res) => res.redirect(301, '/#about'));
app.get('/craft', (req, res) => res.redirect(301, '/#craft'));
app.use('/assets', express.static(resolve(dist, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(resolve(root, 'public'), { index: false }));
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/admin/\nSitemap: ${process.env.SITE_URL || profile.siteUrl}/sitemap.xml\n`));
app.get('/{*path}', async (req, res) => {
  if (!render || !template) return res.status(503).send('API is running. Use the Vite development server for the website, or run npm run build.');
  const path = req.path.replace(/\/$/, '') || '/';
  const posts = await publicPosts();
  const post = posts.find(item => path === `/editorials/${item.slug}`);
  const known = ['/', '/about', '/craft', '/contact', '/editorials', '/dashboard'].includes(path) || post;
  res.status(known ? 200 : 404).set('Cache-Control', 'no-cache').type('html').send(render({ path, posts, template, siteUrl: process.env.SITE_URL || profile.siteUrl }));
});
app.use((error, req, res, next) => {
  console.error(error.message);
  const status = error instanceof multer.MulterError || error.type === 'entity.too.large' ? 400 : error.status || 500;
  res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'That image is too large. Maximum size is 8 MB.' : status < 500 ? error.message : 'The server could not save this change. Please try again.' });
});
const server = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => {
  console.log(`Hansifies IT server listening on port ${server.address().port}. Database ${store ? 'connected' : 'requires DB environment settings'}. Publishing ${auth.configured ? 'configured' : 'requires server credentials'}.`);
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await store?.close(); process.exit(0); }));
