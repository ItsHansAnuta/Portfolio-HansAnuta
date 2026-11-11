import { capabilities, profile, projects } from './content.js';
import Icon from './Icon.jsx';

export function AboutSection() {
  return <section className="about-section section-wrap" id="about" aria-labelledby="about-title">
    <div className="section-kicker"><span>THE PERSON / BEHIND THE PIXELS</span><Icon name="star" /></div>
    <div className="about-layout">
      <h2 className="page-title" id="about-title">A developer.<br />But not <em>just</em><br />a developer.</h2>
      <div className="about-copy">
        <p className="large-copy">Behind every interface is a person figuring things out. Hi, I'm {profile.name}.</p>
        <p>Hansifies IT is my personal corner for the things I build, the things I learn, and the interests that make their way into my work.</p>
        <p>My focus is software: web apps, Windows apps, and Android experiences. This space brings that work together with notes, experiments, and, over time, a little more life beyond the screen.</p>
        <div className="about-signoff"><span className="signature">Hans.</span><span>Still learning. Still making.</span></div>
      </div>
    </div>
  </section>;
}

export function CraftSection() {
  const published = projects.filter(project => project.published);
  return <div id="craft">
    <section className="craft-section section-wrap" aria-labelledby="craft-title">
      <div className="section-kicker"><span>THE CRAFT</span><span>IDEAS → INTERFACES → EVERYDAY TOOLS</span></div>
      <div className="section-heading"><h2 className="page-title" id="craft-title">Different screens.<br /><em>Same curiosity.</em></h2><p>I like turning ideas into software you can actually use.<br />Here's where that takes shape.</p></div>
      <div className="capability-grid">{capabilities.map(item => <article className="capability" key={item.number}>
        <div className="capability-top"><Icon name={item.icon} size={30} /><span>/{item.number}</span></div>
        <h3>{item.title}</h3><p>{item.description}</p><div className="tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      </article>)}</div>
    </section>
    {published.length > 0 && <section className="section-wrap"><div className="section-kicker">SELECTED WORK</div><div className="capability-grid">{published.map(project => <article className="capability" key={project.title}><span className="eyebrow">{project.platform}</span><h3>{project.title}</h3><p>{project.description}</p>{project.url && <a className="text-link" href={project.url} target="_blank" rel="noreferrer">Explore project ↗</a>}</article>)}</div></section>}
  </div>;
}

export function ContactPage() {
  return <section className="contact-section section-wrap route-page">
    <div><span className="eyebrow">A CONVERSATION IS A GOOD START.</span><h1 className="page-title">Got something<br />on your <em>mind?</em></h1><p>A project, a question, or just a shared curiosity.</p>
      <div className="contact-options">
        {profile.email && <a href={`mailto:${profile.email}`}><Icon name="mail" /><span>{profile.email}</span><Icon name="external" /></a>}
        <a href={profile.githubUrl} target="_blank" rel="noreferrer"><Icon name="github" /><span>Find me on GitHub</span><Icon name="external" /></a>
      </div>
      {!profile.email && <p className="contact-pending">Direct contact details will be added here soon.</p>}
    </div>
    <div className="contact-aside"><span className="handwritten">The internet is better<br />with real people.</span><span className="drawn-arrow" aria-hidden="true">⤵</span><div className="social-line"><Icon name="instagram" /><div><span>ALSO, A LITTLE LIFE OUTSIDE CODE</span>{profile.instagramUrl ? <a href={profile.instagramUrl} target="_blank" rel="noreferrer">{profile.instagramName} ↗</a> : <><strong>{profile.instagramName}</strong><small>Instagram · link coming soon</small></>}</div></div></div>
  </section>;
}
