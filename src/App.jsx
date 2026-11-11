import { useEffect, useId, useRef, useState } from 'react';
import { capabilities, notes, profile, projects } from './content.js';
import './styles.css';

function Icon({ name = 'arrow', size = 20, ...props }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: <path d="M7 17 17 7M7 7h10v10" />,
    web: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01m-1 6-3 2 3 2m6-4 3 2-3 2" /></>,
    desktop: <><rect x="3" y="3" width="18" height="13" rx="2" /><path d="M8 21h8m-4-5v5M7 7h6m-6 4h10" /></>,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4m-3 14h2" /></>,
    star: <path d="m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 6 9 7 9-7" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    github: <><path d="M9 19c-5 1-5-3-7-3m14 5v-4a3.5 3.5 0 0 0-1-2.5c3-.3 6-1.5 6-6A4.7 4.7 0 0 0 20 5c.1-1 0-2-.5-3 0 0-1.2-.4-4 1.5a14 14 0 0 0-7 0C5.7 1.6 4.5 2 4.5 2 4 3 3.9 4 4 5a4.7 4.7 0 0 0-1 3.5c0 4.5 3 5.7 6 6A3.5 3.5 0 0 0 8 17v4" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.arrow}</svg>;
}

function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-inner">
      <button className="icon-button dialog-close" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
      <span className="eyebrow">HANSIFIES IT / A CLOSER LOOK</span>
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  </dialog>;
}

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

function App({ path = typeof window === 'undefined' ? '/' : window.location.pathname }) {
  const [dialog, setDialog] = useState(null);
  const [filter, setFilter] = useState('All notes');
  const [resetKey, setResetKey] = useState(0);
  const [light, setLight] = useState(false);
  const publishedProjects = projects.filter(project => project.published);
  const publishedNotes = notes.filter(note => note.published);
  const filters = ['All notes', ...new Set(publishedNotes.map(note => note.category))];
  const article = publishedNotes.find(note => path.replace(/\/$/, '') === `/notes/${note.id}`);
  if (article) return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><a className="brand" href="/">hansifies<span className="brand-it">IT</span></a><a className="text-link" href="/#notebook">← Back to the notebook</a></header>
    <main id="main" className="article-page"><article><span className="eyebrow">{article.label} / {article.category}</span><h1>{article.title}</h1><p className="article-lead">{article.excerpt}</p><div className="article-byline">A note from {profile.name} · Hansifies IT</div>{article.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<a className="text-link" href="/#notebook">← More from the notebook</a></article></main>
    <footer className="site-footer"><a className="brand footer-brand" href="/">hansifies<span className="brand-it">IT</span></a><span>© {new Date().getFullYear()} {profile.name}. Made with intention.</span></footer>
  </>;
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><a className="brand" href="#" aria-label="Hansifies IT home"><span className="brand-symbol">h<span>✳</span></span><span>hansifies<span className="brand-it">IT</span></span></a><nav aria-label="Main navigation"><a href="#about">The person</a><a href="#craft">The craft</a><a href="#notebook">The notebook</a></nav><button className="contact-nav" onClick={() => setDialog('contact')}>Say hello <Icon name="external" size={17} /></button></header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-intro"><div className="eyebrow"><span className="live-dot" /> A PERSONAL SPACE ON THE INTERNET</div><h1 id="hero-title">A curious mind.<br />A <em>hands-on</em> world<span className="title-period">.</span></h1><p>I'm Hans. I build software, follow my curiosity, and collect<br className="desktop-break" /> little moments along the way. Welcome to my corner.</p><a className="text-link" href="#desk">Make yourself at home <span>↘</span></a></div>
        <div className="desk-shell" id="desk"><div className="desk-heading"><span><span className="live-dot" /> HANS'S DESK</span><span className="desk-instruction">A little less scrolling. A little more exploring.</span><button onClick={() => { setResetKey(k => k + 1); setLight(false); }} aria-label="Reset card positions and desk lighting">Reset desk ↻</button></div>
          <div className={`desk ${light ? 'warm-desk' : ''}`}>
            <span className="desk-coordinates" aria-hidden="true">X: curiosity<br />Y: possibility</span>
            <div className="desk-ring ring-a" aria-hidden="true" /><div className="desk-ring ring-b" aria-hidden="true" />
            <DeskCard className="profile-card" label="01 / the human" resetKey={resetKey}><Identity onAbout={() => setDialog('about')} /></DeskCard>
            <DeskCard className="preview-card" label="02 / the things I build" resetKey={resetKey}><AppPreview /></DeskCard>
            <DeskCard className="note-card" label="03 / a thought" resetKey={resetKey}><div className="sticky-note"><span className="note-pin" /><span className="handwritten">Good software.<br />A little personality.<br /><span>A work in progress.</span></span><span className="note-signature">— Hans</span></div></DeskCard>
            <button className={`desk-spark ${light ? 'lit' : ''}`} onClick={() => setLight(!light)} aria-label="Toggle warm desk lighting" aria-pressed={light}>✳</button>
            <span className="spark-caption" aria-hidden="true">a bright idea ↗</span>
            <div className="desk-caption"><span className="drag-icon">⠿</span> Drag the card headers. Click the little things.</div>
            <span className="desk-edition">PERSONAL WEB / VOL. 01</span>
          </div>
        </div>
        <div className="hero-foot"><span>CODE, CURIOSITY & EVERYTHING IN BETWEEN</span><a href="#about">There's more below <span>↓</span></a><span>BUILT TO KEEP EVOLVING</span></div>
      </section>

      <section className="about-section section-wrap" id="about"><div className="section-kicker"><span>01 / THE PERSON</span><Icon name="star" /></div><div className="about-layout"><h2>A developer.<br />But not <em>just</em><br />a developer.</h2><div className="about-copy"><p className="large-copy">Behind every interface is a person figuring things out. Hi, I'm {profile.name}.</p><p>Hansifies IT is my personal corner for the things I build, the things I learn, and the interests that make their way into my work.</p><p>My focus is software: web apps, Windows apps, and Android experiences. This space brings that work together with notes, experiments, and, over time, a little more life beyond the screen.</p><div className="about-signoff"><span className="signature">Hans.</span><span>Still learning. Still making.</span></div></div></div></section>

      <section className="craft-section section-wrap" id="craft"><div className="section-kicker"><span>02 / THE CRAFT</span><span>IDEAS → INTERFACES → EVERYDAY TOOLS</span></div><div className="section-heading"><h2>Different screens.<br /><em>Same curiosity.</em></h2><p>I like turning ideas into software you can actually use.<br />Here's where that takes shape.</p></div><div className="capability-grid">{capabilities.map(capability => <article className="capability" key={capability.number}><div className="capability-top"><Icon name={capability.icon} size={30} /><span>/{capability.number}</span></div><h3>{capability.title}</h3><p>{capability.description}</p><div className="tags">{capability.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>)}</div></section>

      {publishedProjects.length > 0 && <section className="projects-section section-wrap" id="projects"><div className="section-kicker">SELECTED WORK</div><h2>Out in the world.</h2><div className="capability-grid">{publishedProjects.map(project => <article className="capability" key={project.title}><span className="eyebrow">{project.platform}</span><h3>{project.title}</h3><p>{project.description}</p>{project.url && <a className="text-link" href={project.url} target="_blank" rel="noreferrer">Explore project <Icon name="external" /></a>}</article>)}</div></section>}

      <section className="notebook-section section-wrap" id="notebook">
        <div className="section-kicker"><span>03 / THE NOTEBOOK</span><span>A GROWING COLLECTION</span></div>
        <div className="section-heading"><h2>Not everything<br />needs to be <em>a launch.</em></h2><p>Thoughts, small discoveries, and things in progress.<br />The less polished side of making things.</p></div>
        <div className="note-filters" role="group" aria-label="Filter notebook entries">{filters.map(item => <button key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}{item === 'All notes' && <span>{publishedNotes.length.toString().padStart(2, '0')}</span>}</button>)}</div>
        <div className="notebook-grid">{publishedNotes.filter(note => filter === 'All notes' || note.category === filter).map((note, index) => <a className="notebook-card" key={note.id} href={`/notes/${note.id}/`}>
          <div className={`note-illustration illustration-${index % 2}`} aria-hidden="true">{note.category === 'Building' ? <><span className="sketch-window"><span>hello, world.</span><i /><i /><i /></span><span className="sketch-star">✳</span></> : <><span className="sketch-cursor">↖</span><span className="sketch-button">play a little ↗</span><span className="sketch-orbit" /></>}</div>
          <div className="notebook-card-body"><span className="eyebrow">{note.label} <span>{note.category}</span></span><h3>{note.title}</h3><p>{note.excerpt}</p><span className="read-note">Open the notebook <Icon name="external" size={18} /></span></div>
        </a>)}</div>
        <div className="notebook-foot"><span className="live-dot" /> An open notebook, not a finished story.</div>
      </section>

      <section className="contact-section section-wrap" id="contact"><div><span className="eyebrow">A CONVERSATION IS A GOOD START.</span><h2>Got something<br />on your <em>mind?</em><span className="contact-star">✳</span></h2><p>A project, a question, or just a shared curiosity.</p><button className="primary-button" onClick={() => setDialog('contact')}>Let's say hello <Icon name="external" size={19} /></button></div><div className="contact-aside"><span className="handwritten">The internet is better<br />with real people.</span><span className="drawn-arrow" aria-hidden="true">⤵</span><div className="social-line"><Icon name="instagram" /><div><span>ALSO, A LITTLE LIFE OUTSIDE CODE</span>{profile.instagramUrl ? <a href={profile.instagramUrl} target="_blank" rel="noreferrer">{profile.instagramName} ↗</a> : <><strong>{profile.instagramName}</strong><small>Instagram · link coming soon</small></>}</div></div></div></section>
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#">hansifies<span className="brand-it">IT</span></a><span>© {new Date().getFullYear()} {profile.name}. Made with intention.</span><a href="#">Back to the top ↑</a></footer>

    {dialog && <Dialog title={dialog === 'contact' ? 'A little hello.' : dialog === 'about' ? 'The human behind the work.' : dialog.title} onClose={() => setDialog(null)}>
      {dialog === 'contact' ? <>
        <p>{profile.email ? 'A project, a question, or something interesting to share? You can reach me here.' : 'Thanks for stopping by. This space is still taking shape, and my direct contact details will be added here soon.'}</p>
        <div className="contact-options">
          {profile.email && <a href={`mailto:${profile.email}`}><Icon name="mail" /><span>{profile.email}</span><Icon name="external" /></a>}
          <a href={profile.githubUrl} target="_blank" rel="noreferrer"><Icon name="github" /><span>Find me on GitHub</span><Icon name="external" /></a>
          {profile.instagramUrl && <a href={profile.instagramUrl} target="_blank" rel="noreferrer"><Icon name="instagram" /><span>{profile.instagramName}</span><Icon name="external" /></a>}
        </div>
      </> : <>
        <p>I'm {profile.name}, the developer behind Hansifies IT. My work spans web applications, Windows software, and Android apps.</p>
        <p>I want this website to be a living collection: a place for finished work, experiments, personal interests, and things learned along the way.</p>
        <p>For now, take a look around the desk. It's a small taste of how I think about interfaces: useful, approachable, and worth exploring.</p>
        <a className="text-link" href={profile.githubUrl} target="_blank" rel="noreferrer">Explore my GitHub <Icon name="external" /></a>
      </>}
    </Dialog>}
  </>;
}

export default App;
