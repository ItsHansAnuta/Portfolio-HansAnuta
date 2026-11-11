import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { profile } from './content.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const pageTitles = { '/': "Hans Anuta's personal corner", '/about': 'The person', '/craft': 'The craft', '/contact': 'Say hello', '/editorials': 'Editorials — life, in entries', '/dashboard': 'Private publishing desk' };

export function render({ path, posts, template, siteUrl = profile.siteUrl }) {
  const post = posts.find(post => path === `/editorials/${post.slug}`);
  const title = `${post?.title || pageTitles[path] || 'Page not found'} — Hansifies IT`;
  const description = post?.excerpt || 'The personal space of Hans Anuta. Software, editorials, life updates, and things learned along the way.';
  const canonical = `${siteUrl}${path}`;
  const schema = post ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description,
    author: { '@type': 'Person', name: profile.name, url: `${siteUrl}/about` }, url: canonical,
    ...(post.publishedAt ? { datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt } : {}),
    ...(post.cover ? { image: `${siteUrl}${post.cover}` } : {}),
  } : { '@context': 'https://schema.org', '@type': path === '/editorials' ? 'Blog' : 'WebPage', name: title, url: canonical };
  const meta = `<title>${escape(title)}</title><meta name="description" content="${escape(description)}" />
    <meta property="og:title" content="${escape(title)}" /><meta property="og:description" content="${escape(description)}" />
    <meta property="og:type" content="${post ? 'article' : 'website'}" /><meta property="og:site_name" content="Hansifies IT" />
    <meta property="og:url" content="${escape(canonical)}" /><link rel="canonical" href="${escape(canonical)}" />
    <meta name="twitter:card" content="${post?.cover ? 'summary_large_image' : 'summary'}" />
    ${post?.cover ? `<meta property="og:image" content="${escape(siteUrl + post.cover)}" />` : ''}
    ${path === '/dashboard' || (!pageTitles[path] && !post) ? '<meta name="robots" content="noindex, nofollow" />' : ''}
    <script type="application/ld+json">${serialize(schema)}</script>`;
  const html = renderToString(<StaticRouter location={path}><App initialPosts={posts} /></StaticRouter>);
  return template
    .replace(/<!--page-meta-start-->[\s\S]*?<!--page-meta-end-->/, () => `<!--page-meta-start-->${meta}<!--page-meta-end-->`)
    .replace(/<!--app-start-->[\s\S]*?<!--app-end-->/, () => `<!--app-start-->${html}<!--app-end-->`)
    .replace(/<!--data-start-->[\s\S]*?<!--data-end-->/, () => `<!--data-start--><script id="site-data" type="application/json">${serialize({ posts })}</script><!--data-end-->`);
}
