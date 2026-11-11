// Exact snapshots of the two demos shipped in the previous release. These are
// used only to identify untouched database rows, never to seed or publish posts.
const demos = {
  'a-place-to-keep-building': {
    title: 'A place to keep building.',
    excerpt: 'A portfolio can be a work in progress. This one is designed to grow.',
    category: 'Building',
    paragraphs: ['This is the starting point for Hansifies IT: a home for software, experiments, and the things worth documenting along the way.', 'Finished projects will have a place here when they are ready. In the meantime, the interface itself is an experiment in making a personal website feel a little more personal.', 'These notes will become a record of decisions, discoveries, and work in progress. Less of a pitch. More of a notebook.'],
  },
  'interfaces-you-can-touch': {
    title: 'Interfaces you can play with.',
    excerpt: 'A small experiment in making a website feel like a space, not a slide.',
    category: 'Experiments',
    paragraphs: ['The desk at the top of this page is a working interaction experiment. You can move its cards, change the app preview, and turn the identity card over.', 'The goal is to give you something to explore without putting the actual information out of reach. The content is still readable, the controls work with a keyboard, and reduced-motion preferences are respected.'],
  },
};

export function isUntouchedDemo(post) {
  if (!post || typeof post !== 'object') return false;
  const demo = demos[post.id];
  return Boolean(Object.hasOwn(demos, post.id) && post.starter === true && post.slug === post.id && post.status === 'published'
    && post.createdAt === null && post.updatedAt === null && post.publishedAt === null
    && post.cover === '' && post.coverAlt === ''
    && post.title === demo.title && post.excerpt === demo.excerpt && post.category === demo.category
    && Array.isArray(post.blocks) && post.blocks.length === demo.paragraphs.length
    && post.blocks.every((block, index) => block && Object.keys(block).length === 2
      && block.type === 'paragraph' && block.text === demo.paragraphs[index]));
}

export async function removeUntouchedDemos(connection) {
  const [rows] = await connection.execute('SELECT id, data FROM hansifies_posts WHERE id IN (?, ?) FOR UPDATE', Object.keys(demos));
  for (const row of rows) {
    const post = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    if (isUntouchedDemo(post)) await connection.execute('DELETE FROM hansifies_posts WHERE id = ?', [row.id]);
  }
}
