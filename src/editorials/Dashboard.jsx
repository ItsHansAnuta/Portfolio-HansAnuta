import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api.js';
import { ArticleContent } from './Editorials.jsx';
import { formatDate } from './model.js';

const newEntry = () => ({ title: '', excerpt: '', category: 'Editorial', cover: '', coverAlt: '', status: 'draft', blocks: [{ type: 'paragraph', text: '' }] });

export default function Dashboard({ onPublished }) {
  const [session, setSession] = useState(null);
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState([]);
  const [editor, setEditor] = useState(null);
  const [baseline, setBaseline] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [listFilter, setListFilter] = useState('All entries');
  const fileInput = useRef(null);
  const dirty = editor && JSON.stringify(editor) !== baseline;

  useEffect(() => {
    const controller = new AbortController();
    api('/api/admin/session', { signal: controller.signal }).then(setSession).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    api('/api/admin/posts').then(data => setPosts(data.posts)).catch(handleError);
  }, [session?.authenticated]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function handleError(error) {
    setError(error.message);
    if (error.status === 401) setSession(previous => ({ ...previous, authenticated: false }));
  }
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }); setPassword(''); setSession({ configured: true, authenticated: true }); }
    catch (error) { handleError(error); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (dirty && !window.confirm('Leave without saving these changes?')) return;
    setBusy(true); setError('');
    try { await api('/api/admin/logout', { method: 'POST' }); setSession(previous => ({ ...previous, authenticated: false })); setEditor(null); }
    catch (error) { handleError(error); }
    finally { setBusy(false); }
  }
  function openEditor(post = null) {
    if (dirty && !window.confirm('Discard the unsaved changes in this entry?')) return;
    const value = post ? { ...post, blocks: post.blocks.map(block => ({ ...block })) } : newEntry();
    if (!value.blocks.length) value.blocks = [{ type: 'paragraph', text: '' }];
    setEditor(value); setBaseline(JSON.stringify(value)); setPreview(false); setError(''); setMessage('');
  }
  function patch(fields) { setEditor(previous => ({ ...previous, ...fields })); setMessage(''); }
  function updateBlock(index, fields) { patch({ blocks: editor.blocks.map((block, i) => i === index ? { ...block, ...fields } : block) }); }
  function moveBlock(index, direction) {
    const blocks = [...editor.blocks];
    [blocks[index], blocks[index + direction]] = [blocks[index + direction], blocks[index]];
    patch({ blocks });
  }
  async function refresh() {
    const data = await api('/api/admin/posts');
    setPosts(data.posts);
    onPublished(data.posts.filter(post => post.status === 'published'));
  }
  async function save(event) {
    event.preventDefault();
    const status = event.nativeEvent.submitter?.value || editor.status;
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await api(editor.id ? `/api/admin/posts/${editor.id}` : '/api/admin/posts', { method: editor.id ? 'PUT' : 'POST', body: JSON.stringify({ ...editor, status }) });
      setEditor(data.post); setBaseline(JSON.stringify(data.post));
      await refresh();
      setMessage(status === 'published' ? 'Published. Your entry is now on the public journal.' : 'Draft saved. This entry is not visible to the public.');
    } catch (error) { handleError(error); }
    finally { setBusy(false); }
  }
  async function remove(post) {
    if (!window.confirm(`Permanently delete “${post.title}”?`)) return;
    setBusy(true); setError('');
    try { await api(`/api/admin/posts/${post.id}`, { method: 'DELETE' }); if (editor?.id === post.id) { setEditor(null); setBaseline(''); } await refresh(); setMessage('Entry removed.'); }
    catch (error) { handleError(error); }
    finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Choose an image smaller than 8 MB.'); event.target.value = ''; return; }
    setUploading(true); setError('');
    const form = new FormData(); form.append('image', file);
    try { const data = await api('/api/admin/uploads', { method: 'POST', body: form }); patch({ cover: data.url }); }
    catch (error) { handleError(error); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  }

  if (!session?.authenticated) return <section className="publishing-login section-wrap">
    <span className="eyebrow">HANSIFIES IT / PRIVATE PUBLISHING DESK</span><span className="login-symbol" aria-hidden="true">✳</span><h1>A little room<br />to <em>write.</em></h1><p>Your editorials, life updates, and things worth sharing.<br />Sign in to make the next entry.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {session?.configured === false ? <div className="setup-notice"><h2>Your publishing desk is ready for setup.</h2><p>{session.databaseConfigured ? 'The database is connected. Add your dashboard password and session secret in Hostinger to enable sign-in.' : 'Connect your MySQL database and set your dashboard credentials in Hostinger to enable publishing.'}</p><p>Required server settings: <code>DB_HOST</code>, <code>DB_NAME</code>, <code>DB_USER</code>, <code>DB_PASSWORD</code>, <code>ADMIN_PASSWORD_HASH</code>, and <code>SESSION_SECRET</code>.</p><p>Run <code>npm run admin:credentials</code> locally to create dashboard credentials. These are separate from your database password.</p></div> : <form onSubmit={login}><label htmlFor="admin-password">Your dashboard password</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !session} /><button className="primary-button" disabled={busy || !session}>{busy ? 'Signing in…' : !session ? 'Connecting…' : 'Open my publishing desk ↗'}</button></form>}
    <Link className="text-link" to="/editorials">← Back to the public journal</Link>
  </section>;

  const displayed = posts.filter(post => listFilter === 'All entries' || (listFilter === 'Published' ? post.status === 'published' : post.status === 'draft'));
  return <section className="dashboard-page section-wrap">
    <div className="dashboard-heading"><div><span className="eyebrow">JUST YOU & YOUR NEXT IDEA</span><h1>The publishing <em>desk.</em></h1><p>{posts.filter(post => post.status === 'published').length} published · {posts.filter(post => post.status === 'draft').length} drafts</p></div><div className="dashboard-actions"><Link className="secondary-button" to="/editorials">View journal ↗</Link><button className="secondary-button" onClick={logout} disabled={busy}>Sign out</button></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}{editor?.status === 'published' && <Link to={`/editorials/${editor.slug}`}> Read it ↗</Link>}</p>}
    <div className="dashboard-layout"><aside className="dashboard-sidebar"><button className="primary-button" onClick={() => openEditor()} disabled={busy || uploading}>+ Write a new entry</button><label className="sr-only" htmlFor="entry-filter">Filter your entries</label><select id="entry-filter" value={listFilter} onChange={event => setListFilter(event.target.value)}>{['All entries', 'Published', 'Drafts'].map(item => <option key={item}>{item}</option>)}</select><div className="dashboard-entry-list">{displayed.map(post => <div className={`dashboard-entry ${editor?.id === post.id ? 'selected' : ''}`} key={post.id}><button className="entry-edit" onClick={() => openEditor(post)} disabled={busy || uploading}><span className={`status-label ${post.status}`}>{post.status}</span><strong>{post.title}</strong><small>{formatDate(post.updatedAt || post.publishedAt)}</small></button><button className="entry-delete" aria-label={`Delete ${post.title}`} onClick={() => remove(post)} disabled={busy || uploading}>×</button></div>)}{!displayed.length && <p className="sidebar-empty">A fresh page. Start something.</p>}</div></aside>
      {!editor ? <div className="editor-welcome"><span aria-hidden="true">✎</span><h2>What's on your mind?</h2><p>Pick an entry to edit, or start a new one.<br />A paragraph, a photograph, a thought. It all belongs here.</p><button className="text-link" onClick={() => openEditor()}>Write your next entry ↗</button></div> : <div className="editor-workspace"><div className="editor-topline"><span className="eyebrow">{editor.id ? 'EDITING AN ENTRY' : 'A FRESH PAGE'} <span>{dirty ? '· UNSAVED CHANGES' : '· SAVED'}</span></span><button className="secondary-button" onClick={() => setPreview(!preview)}>{preview ? '← Keep writing' : 'Preview entry ↗'}</button></div>
        {preview ? <div className="editor-preview"><ArticleContent post={editor} preview /></div> : <form className="entry-form" onSubmit={save}>
          <fieldset disabled={busy || uploading}>
            <label htmlFor="entry-title">Title</label><input id="entry-title" className="title-input" placeholder="Give this moment a title…" maxLength={160} required value={editor.title} onChange={event => patch({ title: event.target.value })} />
            <div className="editor-field-row"><div><label htmlFor="entry-category">Category</label><input id="entry-category" list="category-suggestions" maxLength={40} value={editor.category} onChange={event => patch({ category: event.target.value })} /><datalist id="category-suggestions">{['Editorial', 'Life', 'Updates', 'Building', 'Experiments'].map(item => <option key={item} value={item} />)}</datalist></div><div><span className="field-label">Visibility</span><span className={`status-label ${editor.status}`}>{editor.status === 'published' ? 'Published · public' : 'Draft · just you'}</span></div></div>
            <label htmlFor="entry-excerpt">A short introduction <span>(optional)</span></label><textarea id="entry-excerpt" rows={2} maxLength={320} placeholder="A little context for the journal card…" value={editor.excerpt} onChange={event => patch({ excerpt: event.target.value })} />
            <span className="field-label">Cover image <span>(optional)</span></span><div className="cover-uploader">{editor.cover ? <><img src={editor.cover} alt={editor.coverAlt || 'Entry cover preview'} /><div><button type="button" className="secondary-button" onClick={() => fileInput.current.click()}>Change image</button><button type="button" className="text-button" onClick={() => patch({ cover: '', coverAlt: '' })}>Remove cover</button></div></> : <button type="button" onClick={() => fileInput.current.click()}><span>↥</span><strong>{uploading ? 'Uploading image…' : 'Add a photograph or cover'}</strong><small>JPG, PNG, WebP, GIF · up to 8 MB</small></button>}<input type="file" ref={fileInput} accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} hidden /></div>
            {editor.cover && <><label htmlFor="cover-alt">Describe the image <span>(for accessibility)</span></label><input id="cover-alt" maxLength={240} value={editor.coverAlt} onChange={event => patch({ coverAlt: event.target.value })} placeholder="What is in this image?" /></>}
            <div className="writing-heading"><label>Your story</label><span>Write in blocks. Give important words their own space.</span></div>
            <div className="writing-blocks">{editor.blocks.map((block, index) => <div className={`writing-block block-${block.type}`} key={index}><div className="block-toolbar"><label className="sr-only" htmlFor={`block-type-${index}`}>Format for block {index + 1}</label><select id={`block-type-${index}`} value={block.type} onChange={event => updateBlock(index, { type: event.target.value })}><option value="paragraph">¶ Paragraph</option><option value="quote">“ Pull quote</option><option value="statement">✳ Highlighted statement</option></select><div><button type="button" aria-label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button><button type="button" aria-label={`Move block ${index + 1} down`} disabled={index === editor.blocks.length - 1} onClick={() => moveBlock(index, 1)}>↓</button><button type="button" aria-label={`Remove block ${index + 1}`} disabled={editor.blocks.length === 1} onClick={() => patch({ blocks: editor.blocks.filter((_, i) => i !== index) })}>×</button></div></div><label className="sr-only" htmlFor={`block-text-${index}`}>Text for block {index + 1}</label><textarea id={`block-text-${index}`} rows={block.type === 'paragraph' ? 5 : 3} maxLength={10000} value={block.text} onChange={event => updateBlock(index, { text: event.target.value })} placeholder={block.type === 'quote' ? 'A line worth pausing for…' : block.type === 'statement' ? 'Something you want to stand out.' : 'Start writing. Make it yours.'} /></div>)}</div>
            <div className="add-blocks">{[['paragraph', '+ Paragraph'], ['quote', '+ Pull quote'], ['statement', '+ Statement']].map(([type, label]) => <button className="secondary-button" type="button" key={type} disabled={editor.blocks.length >= 150} onClick={() => patch({ blocks: [...editor.blocks, { type, text: '' }] })}>{label}</button>)}</div>
            <div className="publish-actions"><span>{uploading ? 'Uploading image…' : 'Your words. Your pace.'}</span><button className="secondary-button" type="submit" value="draft">{editor.status === 'published' ? 'Move to drafts' : 'Save draft'}</button><button className="primary-button" type="submit" value="published">{busy ? 'Saving…' : editor.status === 'published' ? 'Update published entry ↗' : 'Publish entry ↗'}</button></div>
          </fieldset>
        </form>}
      </div>}
    </div>
  </section>;
}
