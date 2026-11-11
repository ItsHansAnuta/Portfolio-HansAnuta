import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { render } from '../dist-ssr/entry-server.js';
import { profile } from '../src/content.js';

// Static pages remain previewable. The Node server renders the same routes
// against the live database, so new posts do not need another deployment.
const template = await readFile(resolve('dist/index.html'), 'utf8');
const paths = ['/', '/contact', '/editorials', '/dashboard'];
for (const path of paths) {
  const directory = resolve('dist', `.${path}`);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'index.html'), render({ path, posts: [], template }));
}
await writeFile(resolve('dist/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/admin/\nSitemap: ${profile.siteUrl}/sitemap.xml\n`);
await writeFile(resolve('dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.filter(path => path !== '/dashboard').map(path => `<url><loc>${profile.siteUrl}${path}</loc></url>`).join('')}</urlset>`);
console.log(`Pre-rendered ${paths.length} routes. Live articles are rendered by the Node.js server.`);
