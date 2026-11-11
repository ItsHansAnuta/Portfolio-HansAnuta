import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

// Generate real HTML for the landing page and each published notebook entry.
// Hosting remains static: Node is only required during the build.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const { profile, notes } = await vite.ssrLoadModule('/src/content.js');
  const template = await readFile(resolve('dist/index.html'), 'utf8');
  const publishedNotes = notes.filter(note => note.published);
  const routes = [{ path: '/', note: null }, ...publishedNotes.map(note => ({ path: `/notes/${note.id}/`, note }))];
  const base = profile.siteUrl ? new URL(profile.siteUrl).origin : null;
  for (const { path, note } of routes) {
    if (note && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.id)) throw new Error(`Invalid notebook id: ${note.id}`);
    const title = note ? `${note.title} — Hansifies IT` : "Hansifies IT — Hans Anuta's personal corner";
    const description = note?.excerpt || 'The personal space of Hans Anuta. Explore Hansifies IT: web, Windows, and Android software, interactive experiments, and an evolving notebook.';
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': note ? 'BlogPosting' : 'ProfilePage',
      ...(base ? { url: `${base}${path}` } : {}),
      ...(note ? { headline: note.title, description, author: { '@type': 'Person', name: profile.name } } : { name: title, mainEntity: { '@type': 'Person', name: profile.name, alternateName: profile.brand, jobTitle: 'Software developer', sameAs: [profile.githubUrl, profile.instagramUrl].filter(Boolean) } }),
    };
    let html = template
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*("\s*\/>)/, `$1${escapeHtml(description)}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*("\s*\/>)/, `$1${escapeHtml(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*("\s*\/>)/, `$1${escapeHtml(description)}$2`)
      .replace('<div id="root"></div>', () => `<div id="root">${renderToString(createElement(App, { path }))}</div>`)
      .replace('</head>', `${base ? `<link rel="canonical" href="${escapeHtml(base + path)}" /><meta property="og:url" content="${escapeHtml(base + path)}" />` : ''}<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script></head>`);
    if (note) html = html.replace('content="website"', 'content="article"');
    const directory = resolve('dist', `.${path}`);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'index.html'), html);
  }
  await writeFile(resolve('dist/robots.txt'), `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
  if (base) await writeFile(resolve('dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${escapeHtml(base + route.path)}</loc></url>`).join('')}</urlset>`);
  console.log(`Pre-rendered ${routes.length} pages.${base ? ' Canonicals and sitemap generated.' : ' Set profile.siteUrl to generate canonicals and sitemap.'}`);
} finally {
  await vite.close();
}
