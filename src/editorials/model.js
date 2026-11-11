import { notes } from '../content.js';

export const seedPosts = notes.filter(note => note.published).map(note => ({
  id: note.id,
  slug: note.id,
  title: note.title,
  excerpt: note.excerpt,
  category: note.category,
  cover: '',
  coverAlt: '',
  blocks: note.body.map(text => ({ type: 'paragraph', text })),
  status: 'published',
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
  starter: true,
}));

export function readingTime(post) {
  const words = post.blocks.map(block => block.text).join(' ').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'From the studio';
}
