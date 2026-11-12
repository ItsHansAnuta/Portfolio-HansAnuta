import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { profile } from '../content.js';
import { formatDate, readingTime } from './model.js';

export function Editorials({ posts, feedState }) {
  const location = useLocation();
  const [category, setCategory] = useState('Everything');
  const [query, setQuery] = useState('');
  const categories = ['Everything', ...new Set(posts.map(post => post.category))];
  const filtered = posts.filter(post => (category === 'Everything' || post.category === category) && `${post.title} ${post.excerpt} ${post.blocks.map(block => block.text).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section className="journal-page section-wrap">
    <div className="section-kicker"><span>THE EDITORIALS / AN OPEN JOURNAL</span><span><span className="live-dot" /> WRITTEN BY HANS</span></div>
    <div className="journal-heading"><div><span className="journal-overline">THINGS MADE. THINGS FELT. THINGS LEARNED.</span><h1>Life, in <em>entries.</em></h1></div><p>Updates from my world. Longer thoughts.{' '}<br />Little things worth keeping.<br /><span>A personal record, one post at a time.</span></p></div>
    <div className="journal-tools">
      <div className="journal-filters" role="group" aria-label="Filter editorials">{categories.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}{item === 'Everything' && <span>{posts.length.toString().padStart(2, '0')}</span>}</button>)}</div>
      <label className="journal-search"><span className="sr-only">Search editorials</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Find a thought…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    {feedState.error && <p className="inline-notice" role="status">{feedState.error} <button onClick={() => window.location.reload()}>Refresh</button></p>}
    {filtered.length ? <div className="editorial-grid">{filtered.map((post, index) => {
      const quote = post.blocks.find(block => block.type === 'quote' || block.type === 'statement');
      return <Link className={`editorial-card editorial-card-${index % 4} ${post.cover ? 'has-cover' : 'no-cover'}`} key={post.id} to={`/editorials/${post.slug}`} state={{ backgroundLocation: location }}>
        <div className="editorial-art">
          {post.cover ? <img src={post.cover} alt={post.coverAlt || ''} loading={index > 1 ? 'lazy' : 'eager'} /> : <><span className="editorial-art-grid" />{quote && <><span className="editorial-art-symbol" aria-hidden="true">“</span><span className="editorial-art-quote">{quote.text.slice(0, 140)}{quote.text.length > 140 ? '…' : ''}</span></>}{!quote && <span className="editorial-art-label">{post.category.toUpperCase()}</span>}</>}
          <span className="entry-number">ENTRY / {(index + 1).toString().padStart(2, '0')}</span>
          <span className="open-article" aria-hidden="true">↗</span>
        </div>
        <div className="editorial-card-copy"><div className="editorial-meta"><span>{post.category}</span><span>{formatDate(post.publishedAt)}</span></div><h2>{post.title}</h2><p>{post.excerpt || post.blocks.find(block => block.type === 'paragraph')?.text.slice(0, 180)}</p><div className="editorial-card-foot"><span>{readingTime(post)} MIN READ</span><span>Read this entry ↗</span></div></div>
      </Link>;
    })}</div> : <div className="empty-state"><h2>{query || category !== 'Everything' ? 'No matching thoughts. Yet.' : 'The next chapter starts here.'}</h2><p>{query || category !== 'Everything' ? 'Try a different search or category.' : 'New editorials, life updates, and things in progress will appear here.'}</p>{(query || category !== 'Everything') && <button className="secondary-button" onClick={() => { setQuery(''); setCategory('Everything'); }}>Clear filters</button>}</div>}
    <div className="journal-end"><span className="live-dot" /><span>{feedState.loading ? 'Checking the latest entries…' : 'An open journal. Never quite finished.'}</span><span>HANSIFIES IT / PERSONAL WEB</span></div>
  </section>;
}

export function ArticleContent({ post, preview = false }) {
  return <article className="editorial-article">
    <header className="article-heading"><span className="eyebrow">{post.category} / {preview ? 'UNPUBLISHED PREVIEW' : 'FROM THE JOURNAL'}</span><h1>{post.title || 'Your title goes here.'}</h1>{post.excerpt && <p className="article-deck">{post.excerpt}</p>}<div className="article-author"><span className="author-monogram">h.</span><div><strong>{profile.name}</strong><span>{formatDate(post.publishedAt)} · {readingTime(post)} min read</span></div><span className="article-wordmark">HANSIFIES IT</span></div></header>
    {post.cover && <figure className="article-cover"><img src={post.cover} alt={post.coverAlt || ''} /><figcaption>{post.coverAlt}</figcaption></figure>}
    <div className="article-prose">{post.blocks.map((block, index) => block.type === 'quote' ? <blockquote key={index}><span aria-hidden="true">“</span>{block.text}</blockquote> : <p key={index} className={block.type === 'statement' ? 'narrative-statement' : ''}>{block.text}</p>)}</div>
    <div className="article-endmark" aria-hidden="true" />
  </article>;
}

export function ArticleReader({ posts, overlay = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dialog = useRef(null);
  const content = useRef(null);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const post = posts.find(item => item.slug === slug) || (loaded?.slug === slug ? loaded : null);

  useEffect(() => {
    if (post) return;
    const controller = new AbortController();
    setError('');
    fetch(`/api/posts/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(response.status === 404 ? 'This entry is no longer available.' : 'This entry could not be loaded. Please try again.');
      const data = await response.json();
      setLoaded(data.post);
    }).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, [slug, Boolean(post)]);

  useEffect(() => {
    if (!overlay) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, [overlay]);
  useEffect(() => { content.current?.scrollTo({ top: 0 }); }, [slug]);

  function back() { if (overlay) navigate(-1); else navigate('/editorials'); }
  const body = <>
    <div className="reader-toolbar"><button className="reader-back" onClick={back}>← Back to editorials</button><span>THE JOURNAL / HANSIFIES IT</span><button className="reader-close" onClick={back} aria-label="Close article">×</button></div>
    <div className="reader-scroll" ref={content}>
      {post ? <ArticleContent post={post} /> : <div className="empty-state" role="status"><h1>{error || 'Opening this entry…'}</h1><button className="secondary-button" onClick={back}>Back to editorials</button></div>}
      {post && <div className="reader-bottom"><span>Thanks for spending a little time here.</span><button className="text-link" onClick={back}>← Back to the journal</button></div>}
    </div>
  </>;
  return overlay ? <dialog className="article-dialog" ref={dialog} aria-label={post?.title || 'Editorial reader'} onCancel={event => { event.preventDefault(); back(); }} onClick={event => { if (event.target === event.currentTarget) back(); }}><div className="reader-panel">{body}</div></dialog> : <div className="standalone-reader">{body}</div>;
}
