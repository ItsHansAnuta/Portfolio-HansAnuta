// Your site's content lives here. Null values stay unpublished.
// Put images in public/images and use a path such as /images/hans.webp.
export const profile = {
  name: 'Hans Anuta',
  brand: 'Hansifies IT',
  siteUrl: 'https://hansifies.io',
  role: 'Software developer & curious human',
  email: null,
  instagramName: 'Donovan Galager',
  instagramUrl: null,
  portrait: null,
  portraitAlt: 'Hans Anuta',
  githubUrl: 'https://github.com/ItsHansAnuta',
};

export const capabilities = [
  { number: '01', title: 'On the web.', description: 'Websites and web applications. Thoughtful interfaces, useful features, and the systems that connect them.', tags: ['React', 'JavaScript', 'Node.js'], icon: 'web' },
  { number: '02', title: 'On your desktop.', description: 'Windows applications built around real workflows. Software that feels at home on the machine you use every day.', tags: ['Windows', 'Desktop software'], icon: 'desktop' },
  { number: '03', title: 'In your pocket.', description: 'Android applications that bring an idea into everyday life. Small screens, considered interactions.', tags: ['Android', 'Mobile experiences'], icon: 'mobile' },
];

// Only entries with published: true are shown. The entire section disappears
// when there are no published projects. Do not add confidential project data.
export const projects = [];
// Example: { title: 'App name', description: 'What it does.',
//   platform: 'Web app', url: 'https://...', published: true }

// These are starter site notes, not claims about past client work or hobbies.
// Add your own writing here, then set published: true.
export const notes = [
  {
    id: 'a-place-to-keep-building', category: 'Building', label: 'Site note / 001',
    title: 'A place to keep building.', excerpt: 'A portfolio can be a work in progress. This one is designed to grow.',
    body: ['This is the starting point for Hansifies IT: a home for software, experiments, and the things worth documenting along the way.', 'Finished projects will have a place here when they are ready. In the meantime, the interface itself is an experiment in making a personal website feel a little more personal.', 'These notes will become a record of decisions, discoveries, and work in progress. Less of a pitch. More of a notebook.'],
    published: true,
  },
  {
    id: 'interfaces-you-can-touch', category: 'Experiments', label: 'Site note / 002',
    title: 'Interfaces you can play with.', excerpt: 'A small experiment in making a website feel like a space, not a slide.',
    body: ['The desk at the top of this page is a working interaction experiment. You can move its cards, change the app preview, and turn the identity card over.', 'The goal is to give you something to explore without putting the actual information out of reach. The content is still readable, the controls work with a keyboard, and reduced-motion preferences are respected.'],
    published: true,
  },
];
