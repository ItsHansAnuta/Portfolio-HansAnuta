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

// Editorials start empty and are published exclusively through the dashboard.
