import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { profile } from './content.js';
import { Editorials, ArticleReader } from './editorials/Editorials.jsx';
import Dashboard from './editorials/Dashboard.jsx';
import { AboutSection, CraftSection, ContactPage } from './PortfolioPages.jsx';
import Icon from './Icon.jsx';
import './styles.css';
import './editorials/editorials.css';

function DeskCard({ className, label, children, resetKey }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  useEffect(() => { setPosition({ x: 0, y: 0 }); }, [resetKey]);
  function start(event) {
    if (event.button !== 0) return;
    const parent = event.currentTarget.closest('.desk-card');
    const desk = parent.parentElement.getBoundingClientRect();
    const card = parent.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, origin: position, minX: position.x + desk.left - card.left, maxX: position.x + desk.right - card.right, minY: position.y + desk.top - card.top, maxY: position.y + desk.bottom - card.bottom };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const d = drag.current;
    if (!d) return;
    setPosition({ x: Math.max(d.minX, Math.min(d.maxX, d.origin.x + event.clientX - d.x)), y: Math.max(d.minY, Math.min(d.maxY, d.origin.y + event.clientY - d.y)) });
  }
  return <div className={`desk-card ${className}`} style={{ '--drag-x': `${position.x}px`, '--drag-y': `${position.y}px` }}>
    <div className="card-handle" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><span className="handle-dots" aria-hidden="true">⠿</span>{label}<span className="handle-plus" aria-hidden="true">+</span></div>
    {children}
  </div>;
}

function Identity({ onAbout }) {
  const [flipped, setFlipped] = useState(false);
  const ref = useRef(null);
  function tilt(event) {
    const box = event.currentTarget.getBoundingClientRect();
    ref.current.style.setProperty('--rx', `${((event.clientY - box.top) / box.height - .5) * -13}deg`);
    ref.current.style.setProperty('--ry', `${((event.clientX - box.left) / box.width - .5) * 13}deg`);
  }
  return <div className="identity-wrap" ref={ref} onPointerMove={tilt} onPointerLeave={() => { ref.current.style.setProperty('--rx', '0deg'); ref.current.style.setProperty('--ry', '0deg'); }}>
    <button className={`identity ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Show identity artwork' : 'Turn over my identity card'}>
      <span className="identity-front">
        {profile.portrait ? <img src={profile.portrait} alt={profile.portraitAlt} /> : <span className="identity-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit orbit-three" /><span className="monogram">h<span>.</span></span><span className="art-spark">✳</span></span>}
        <span className="id-top">THE PERSON BEHIND THE PIXELS <span>↗</span></span>
        <span className="id-bottom"><strong>{profile.name}</strong><span>Developer. Human. Always curious.</span></span>
        <span className="flip-hint">↻ click to turn over</span>
      </span>
      <span className="identity-back"><span className="eyebrow">HELLO, I'M HANS.</span><strong>A little logic.<br />A lot of curiosity.</strong><span>I build software for the web, Windows, and Android. This is my space to share the work and the person behind it.</span><span className="flip-hint">↻ back to the other side</span></span>
    </button>
    <button className="identity-more" onClick={onAbout}>A little more about me <Icon name="external" size={15} /></button>
  </div>;
}

function AppPreview() {
  const [platform, setPlatform] = useState('Web');
  const [items, setItems] = useState([{ title: 'Make something useful', done: true }, { title: 'Make it feel good', done: false }, { title: 'Keep getting better', done: false }]);
  return <div className="app-preview">
    <div className="preview-toolbar"><span className="window-dots"><i /><i /><i /></span><span>little things.app</span><Icon name={platform === 'Web' ? 'web' : platform === 'Windows' ? 'desktop' : 'mobile'} size={13} /></div>
    <div className="platform-tabs" role="group" aria-label="Preview platform">{['Web', 'Windows', 'Android'].map(p => <button key={p} aria-pressed={platform === p} onClick={() => setPlatform(p)}>{p}</button>)}</div>
    <div className={`mini-app ${platform.toLowerCase()}`}><div className="mini-app-top"><span className="mini-app-icon">✳</span><span>SMALL STEPS, GOOD THINGS</span></div><h3>A little progress.</h3><p>An interactive little idea. Give it a try.</p><div className="task-list">{items.map((item, i) => <button key={item.title} className={item.done ? 'task done' : 'task'} onClick={() => setItems(items.map((t, j) => j === i ? { ...t, done: !t.done } : t))} aria-pressed={item.done}><span className="checkbox">{item.done ? '✓' : ''}</span><span>{item.title}</span></button>)}</div><div className="progress-track"><span style={{ width: `${items.filter(i => i.done).length / items.length * 100}%` }} /></div><span className="progress-label">{items.filter(i => i.done).length} of 3 little things</span></div>
    <div className="preview-footer"><span className="live-dot" /> A working UI experiment <span>↖ try me</span></div>
  </div>;
}

function HomePage() {
  const [resetKey, setResetKey] = useState(0);
  const [light, setLight] = useState(false);
  return <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-intro"><div className="eyebrow"><span className="live-dot" /> A PERSONAL SPACE ON THE INTERNET</div><h1 id="hero-title">A curious mind.<br />A <em>hands-on</em> world<span className="title-period">.</span></h1><p>I'm Hans. I build software, follow my curiosity, and collect<br className="desktop-break" /> little moments along the way. Welcome to my corner.</p><Link className="text-link" to="/editorials">Open my journal <span>↗</span></Link></div>
        <div className="desk-shell" id="desk"><div className="desk-heading"><span><span className="live-dot" /> HANS'S DESK</span><span className="desk-instruction">A little less scrolling. A little more exploring.</span><button onClick={() => { setResetKey(k => k + 1); setLight(false); }} aria-label="Reset card positions and desk lighting">Reset desk ↻</button></div>
          <div className={`desk ${light ? 'warm-desk' : ''}`}>
            <span className="desk-coordinates" aria-hidden="true">X: curiosity<br />Y: possibility</span>
            <div className="desk-ring ring-a" aria-hidden="true" /><div className="desk-ring ring-b" aria-hidden="true" />
            <DeskCard className="profile-card" label="01 / the human" resetKey={resetKey}><Identity onAbout={() => document.getElementById('about')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })} /></DeskCard>
            <DeskCard className="preview-card" label="02 / the things I build" resetKey={resetKey}><AppPreview /></DeskCard>
            <DeskCard className="note-card" label="03 / a thought" resetKey={resetKey}><div className="sticky-note"><span className="note-pin" /><span className="handwritten">Good software.<br />A little personality.<br /><span>A work in progress.</span></span><span className="note-signature">— Hans</span></div></DeskCard>
            <button className={`desk-spark ${light ? 'lit' : ''}`} onClick={() => setLight(!light)} aria-label="Toggle warm desk lighting" aria-pressed={light}>✳</button>
            <span className="spark-caption" aria-hidden="true">a bright idea ↗</span>
            <div className="desk-caption"><span className="drag-icon">⠿</span> Drag the card headers. Click the little things.</div>
            <span className="desk-edition">PERSONAL WEB / VOL. 01</span>
          </div>
        </div>
        <div className="hero-foot"><span>CODE, CURIOSITY & EVERYTHING IN BETWEEN</span><a href="#about">Meet the person <span>↓</span></a><span>BUILT TO KEEP EVOLVING</span></div>
      </section>
      <AboutSection />
      <CraftSection />
  </>;
}

const pageNames = { '/': 'A personal corner', '/editorials': 'Editorials', '/contact': 'Say hello', '/dashboard': 'Publishing desk' };

function App({ initialPosts = [] }) {
  const location = useLocation();
  const background = location.state?.backgroundLocation;
  const previousBackground = useRef(false);
  const [posts, setPosts] = useState(initialPosts);
  const [feedState, setFeedState] = useState({ loading: false, error: '' });

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard')) return;
    const controller = new AbortController();
    setFeedState({ loading: true, error: '' });
    fetch('/api/posts', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('The journal could not be refreshed. Please try again.');
      const data = await response.json();
      setPosts(data.posts);
      setFeedState({ loading: false, error: '' });
    }).catch(error => {
      if (error.name !== 'AbortError') setFeedState({ loading: false, error: 'The journal could not be refreshed. Please try again.' });
    });
    return () => controller.abort();
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash && !background) {
      const target = document.getElementById(location.hash.slice(1));
      target?.scrollIntoView({ behavior: 'instant' });
      previousBackground.current = false;
      return;
    }
    if (!background && !previousBackground.current) window.scrollTo({ top: 0, behavior: 'instant' });
    previousBackground.current = Boolean(background);
  }, [location.key, location.pathname, location.hash, background]);

  useEffect(() => {
    const name = posts.find(post => location.pathname === `/editorials/${post.slug}`)?.title || pageNames[location.pathname] || 'Journal';
    document.title = `${name} — Hansifies IT`;
  }, [location.pathname, posts]);

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header app-header">
      <Link className="brand" to="/" aria-label="Hansifies IT home"><span className="brand-symbol">h<span>✳</span></span><span>hansifies<span className="brand-it">IT</span></span></Link>
      <nav aria-label="Main navigation">{[['/', 'Home'], ['/editorials', 'Editorials']].map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      <NavLink className="contact-nav" to="/contact">Say hello <Icon name="external" size={17} /></NavLink>
    </header>
    <main id="main" tabIndex={-1}>
      <Routes location={background || location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/craft" element={<Navigate to="/#craft" replace />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/editorials" element={<Editorials posts={posts} feedState={feedState} />} />
        <Route path="/editorials/:slug" element={<ArticleReader posts={posts} />} />
        <Route path="/notes/:slug" element={<ArticleReader posts={posts} legacy />} />
        <Route path="/dashboard" element={<Dashboard onPublished={setPosts} />} />
        <Route path="*" element={<div className="empty-state section-wrap"><span className="eyebrow">404 / A WRONG TURN</span><h1>This page isn't here.</h1><Link className="text-link" to="/">Back to my corner ↗</Link></div>} />
      </Routes>
    </main>
    <footer className="site-footer"><Link className="brand footer-brand" to="/">hansifies<span className="brand-it">IT</span></Link><span>© {new Date().getFullYear()} {profile.name}. Made with intention.</span><Link to="/dashboard">Publishing desk ↗</Link></footer>
    {background && <Routes><Route path="/editorials/:slug" element={<ArticleReader posts={posts} overlay />} /></Routes>}
  </>;
}

export default App;
