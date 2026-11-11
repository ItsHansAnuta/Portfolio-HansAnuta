import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { seedPosts } from '../src/editorials/model.js';

export async function openStore(env = process.env) {
  if (!env.DB_HOST || !env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD) return null;
  const pool = mysql.createPool({
    host: env.DB_HOST, port: Number(env.DB_PORT || 3306), database: env.DB_NAME,
    user: env.DB_USER, password: env.DB_PASSWORD,
    waitForConnections: true, connectionLimit: 5, charset: 'utf8mb4',
    ...(env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  await pool.query(`CREATE TABLE IF NOT EXISTS hansifies_posts (
    id VARCHAR(100) PRIMARY KEY, slug VARCHAR(160) NOT NULL UNIQUE, data JSON NOT NULL
  ) CHARACTER SET utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS hansifies_settings (
    name VARCHAR(100) PRIMARY KEY, value TEXT
  ) CHARACTER SET utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS hansifies_images (
    filename VARCHAR(100) PRIMARY KEY, mime VARCHAR(40) NOT NULL, content MEDIUMBLOB NOT NULL
  )`);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT IGNORE INTO hansifies_settings (name, value) VALUES ('initialized', 'true')");
    if (result.affectedRows) {
      for (const post of seedPosts) await connection.execute('INSERT INTO hansifies_posts (id, slug, data) VALUES (?, ?, ?)', [post.id, post.slug, JSON.stringify(post)]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }

  const decode = row => row ? typeof row.data === 'string' ? JSON.parse(row.data) : row.data : null;
  const all = async () => {
    const [rows] = await pool.query('SELECT data FROM hansifies_posts');
    return rows.map(decode).sort((a, b) => (b.publishedAt || b.createdAt || '').localeCompare(a.publishedAt || a.createdAt || '') || a.id.localeCompare(b.id));
  };
  const byId = async id => { const [rows] = await pool.execute('SELECT data FROM hansifies_posts WHERE id = ?', [id]); return decode(rows[0]); };
  return {
    all,
    published: async () => (await all()).filter(post => post.status === 'published'),
    byId,
    bySlug: async slug => { const [rows] = await pool.execute('SELECT data FROM hansifies_posts WHERE slug = ?', [slug]); return decode(rows[0]); },
    async save(input, existing = null) {
      const now = new Date().toISOString();
      const id = existing?.id || randomUUID();
      const stem = input.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'entry';
      const slug = existing?.slug || `${stem}-${id.slice(0, 8)}`;
      const post = { ...input, id, slug, createdAt: existing?.createdAt || now, updatedAt: now,
        publishedAt: input.status === 'published' ? existing?.publishedAt || now : existing?.publishedAt || null };
      if (existing) {
        const [result] = await pool.execute('UPDATE hansifies_posts SET data = ? WHERE id = ? AND NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data, \'$.updatedAt\')), \'null\') <=> ?', [JSON.stringify(post), id, existing.updatedAt]);
        if (!result.affectedRows) { const error = new Error('This entry changed in another tab. Reopen it before saving.'); error.status = 409; throw error; }
      } else await pool.execute('INSERT INTO hansifies_posts (id, slug, data) VALUES (?, ?, ?)', [id, slug, JSON.stringify(post)]);
      return post;
    },
    remove: id => pool.execute('DELETE FROM hansifies_posts WHERE id = ?', [id]),
    async image(filename) { const [rows] = await pool.execute('SELECT mime, content FROM hansifies_images WHERE filename = ?', [filename]); return rows[0] || null; },
    saveImage: (filename, mime, buffer) => pool.execute('INSERT INTO hansifies_images (filename, mime, content) VALUES (?, ?, ?)', [filename, mime, buffer]),
    close: () => pool.end(),
  };
}

export function validatePost(body) {
  const fail = message => { const error = new Error(message); error.status = 400; throw error; };
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Send an entry as a JSON object.');
  const text = (value, max, label) => {
    if (typeof value !== 'string' || value.length > max) fail(`${label} must be text under ${max} characters.`);
    return value.trim();
  };
  const title = text(body.title, 160, 'Title');
  if (!title) fail('Give this entry a title.');
  const status = body.status;
  if (!['draft', 'published'].includes(status)) fail('Choose draft or published.');
  const category = text(body.category || 'Editorial', 40, 'Category') || 'Editorial';
  const excerpt = text(body.excerpt || '', 320, 'Excerpt');
  const cover = text(body.cover || '', 150, 'Cover');
  if (cover && !/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(cover)) fail('Use an image uploaded through the dashboard.');
  const coverAlt = text(body.coverAlt || '', 240, 'Image description');
  if (!Array.isArray(body.blocks) || body.blocks.length > 150) fail('Use up to 150 text blocks.');
  const blocks = body.blocks.map(block => {
    if (!block || !['paragraph', 'quote', 'statement'].includes(block.type)) fail('Unknown text block format.');
    return { type: block.type, text: text(block.text, 10000, 'Text block') };
  }).filter(block => block.text);
  if (status === 'published' && !blocks.length) fail('Add some writing before publishing.');
  return { title, status, category, excerpt, cover, coverAlt, blocks };
}
