import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { makeAuth } from '../server/auth.mjs';
import { openStore, validatePost } from '../server/store.mjs';
import { isUntouchedDemo } from '../server/demo-cleanup.mjs';

const legacyDemos = JSON.parse(await readFile(new URL('./fixtures/legacy-demos.json', import.meta.url), 'utf8'));

test('demo cleanup recognizes only untouched originals, independently of JSON key order', () => {
  for (const post of legacyDemos) {
    assert.equal(isUntouchedDemo(post), true);
    assert.equal(isUntouchedDemo({ ...post, blocks: post.blocks.map(({ type, text }) => ({ text, type })) }), true);
    assert.equal(isUntouchedDemo({ ...post, title: 'My own title' }), false);
    assert.equal(isUntouchedDemo({ ...post, updatedAt: new Date().toISOString() }), false);
    assert.equal(isUntouchedDemo({ ...post, id: randomBytes(8).toString('hex') }), false);
    assert.equal(isUntouchedDemo({ ...post, blocks: [{ ...post.blocks[0], text: 'My own writing' }, ...post.blocks.slice(1)] }), false);
    assert.equal(isUntouchedDemo({ ...post, starter: undefined }), false);
  }
});

function response() {
  return { statusCode: 200, body: null, cookies: {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; }, cookie(name, value, options) { this.cookies[name] = { value, options }; }, clearCookie() {} };
}
const password = randomBytes(20).toString('hex');
const secret = randomBytes(40).toString('hex');

test('signed sessions reject wrong passwords, tampering, and changed credentials', () => {
  const auth = makeAuth({ password, secret, production: true });
  const wrong = response();
  auth.login({ ip: 'test', body: { password: 'incorrect' } }, wrong);
  assert.equal(wrong.statusCode, 401);
  const success = response();
  auth.login({ ip: 'test', body: { password } }, success);
  assert.equal(success.statusCode, 200);
  const cookie = success.cookies.hans_session;
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, 'strict');
  assert.equal(auth.authenticated({ headers: { cookie: `hans_session=${cookie.value}` } }), true);
  assert.equal(auth.authenticated({ headers: { cookie: `hans_session=x${cookie.value}` } }), false);
  assert.equal(makeAuth({ password: password + 'changed', secret }).authenticated({ headers: { cookie: `hans_session=${cookie.value}` } }), false);
  const unconfigured = makeAuth({ password: 'short', secret });
  assert.equal(unconfigured.configured, false);
});

test('scrypt dashboard credentials work and failed login attempts are limited', () => {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
  const auth = makeAuth({ passwordHash, secret });
  const success = response();
  auth.login({ ip: 'owner', body: { password } }, success);
  assert.equal(success.body.authenticated, true);
  for (let i = 0; i < 8; i++) auth.login({ ip: 'attempts', body: { password: 'wrong' } }, response());
  const blocked = response();
  auth.login({ ip: 'attempts', body: { password } }, blocked);
  assert.equal(blocked.statusCode, 429);
});

test('post validation rejects unsafe covers and empty published entries, preserves plain text', () => {
  const entry = { title: 'A thought', status: 'published', blocks: [{ type: 'quote', text: '<script>This stays plain text.</script>' }] };
  assert.equal(validatePost(entry).blocks[0].text, entry.blocks[0].text);
  assert.throws(() => validatePost({ ...entry, cover: 'https://other.site/tracker.svg' }), /uploaded through the dashboard/);
  assert.throws(() => validatePost({ ...entry, blocks: [] }), /before publishing/);
  assert.throws(() => validatePost({ ...entry, blocks: [{ type: 'html', text: 'invalid' }] }), /Unknown text block/);
  assert.throws(() => validatePost(null), /JSON object/);
  assert.equal(validatePost({ ...entry, status: 'draft', blocks: [] }).status, 'draft');
});

const databaseConfigured = ['HOST', 'NAME', 'USER', 'PASSWORD'].every(key => process.env[`TEST_DB_${key}`] !== undefined);

test('MySQL API: login, upload, drafts, publish, SSR, edits, unpublish, restart persistence, delete', { skip: !databaseConfigured }, async () => {
  assert.match(process.env.TEST_DB_NAME, /^hansifies_test_[a-z0-9_]+$/, 'Use a dedicated disposable test database.');
  let child;
  let base;
  let cookie;
  const env = { ...process.env, NODE_ENV: 'test', PORT: '0', HOST: '127.0.0.1', ADMIN_PASSWORD: password, ADMIN_PASSWORD_HASH: '', SESSION_SECRET: secret,
    DB_HOST: process.env.TEST_DB_HOST, DB_PORT: process.env.TEST_DB_PORT || '3306', DB_NAME: process.env.TEST_DB_NAME,
    DB_USER: process.env.TEST_DB_USER, DB_PASSWORD: process.env.TEST_DB_PASSWORD };
  async function start() {
    child = spawn(process.execPath, ['server/index.mjs'], { cwd: new URL('../', import.meta.url), env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 15000);
      child.stdout.on('data', data => { output += data; const match = output.match(/listening on port (\d+)/); if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); } });
      child.stderr.on('data', data => { output += data; });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${output}`)); });
    });
  }
  async function stop() { if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } }
  const request = (path, options = {}) => fetch(base + path, { ...options, headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  try {
    const preparation = await openStore(env);
    assert.equal((await preparation.all()).length, 0, 'new databases start without sample posts');
    const ownerPost = await preparation.save(validatePost({ title: 'Owner-authored migration check', status: 'published', blocks: [{ type: 'paragraph', text: 'Keep my writing.' }] }));
    await preparation.close();
    const connection = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD });
    try {
      const editedDemo = { ...legacyDemos[1], blocks: [{ type: 'paragraph', text: 'A passage the owner has rewritten.' }] };
      for (const post of [legacyDemos[0], editedDemo]) await connection.execute('INSERT INTO hansifies_posts (id, slug, data) VALUES (?, ?, ?)', [post.id, post.slug, JSON.stringify(post)]);
      await connection.execute("DELETE FROM hansifies_settings WHERE name = 'remove-untouched-demos-v1'");
    } finally { await connection.end(); }
    await start();
    const migrated = (await (await request('/api/posts')).json()).posts;
    assert.ok(!migrated.some(post => post.id === legacyDemos[0].id), 'untouched demo is removed on startup');
    assert.ok(migrated.some(post => post.id === legacyDemos[1].id), 'owner-edited demo is preserved');
    assert.ok(migrated.some(post => post.id === ownerPost.id), 'owner-authored post is preserved');
    assert.equal((await request('/api/admin/posts')).status, 401);
    assert.equal((await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }), headers: { Origin: 'https://other.site' } })).status, 403);
    assert.equal((await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: 'bad' }) })).status, 401);
    const login = await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    assert.equal(login.status, 200);
    cookie = login.headers.get('set-cookie').split(';')[0];
    for (const id of [legacyDemos[1].id, ownerPost.id]) assert.equal((await request(`/api/admin/posts/${id}`, { method: 'DELETE' })).status, 200);
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6fkAAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.append('image', new Blob([image], { type: 'image/png' }), 'test.png');
    const upload = await request('/api/admin/uploads', { method: 'POST', body: form });
    assert.equal(upload.status, 201);
    const { url: cover } = await upload.json();
    assert.deepEqual(Buffer.from(await (await request(cover)).arrayBuffer()), image);
    const badImage = new FormData(); badImage.append('image', new Blob(['<svg />'], { type: 'image/png' }), 'fake.png');
    assert.equal((await request('/api/admin/uploads', { method: 'POST', body: badImage })).status, 400);
    const title = `Integration thought ${randomBytes(5).toString('hex')}`;
    const created = await request('/api/admin/posts', { method: 'POST', body: JSON.stringify({ title, status: 'draft', category: 'Updates', excerpt: 'A test introduction.', cover, coverAlt: 'A tiny test image.', blocks: [{ type: 'paragraph', text: 'A little update.' }, { type: 'quote', text: 'A thought worth keeping.' }, { type: 'statement', text: 'Make it matter.' }] }) });
    assert.equal(created.status, 201);
    let { post } = await created.json();
    assert.ok(!(await (await request('/api/posts')).json()).posts.find(item => item.id === post.id));
    assert.equal((await request(`/api/posts/${post.slug}`)).status, 404);
    const saved = await request(`/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...post, status: 'published' }) });
    assert.equal(saved.status, 200);
    const stale = post;
    ({ post } = await saved.json());
    assert.ok((await (await request('/api/posts')).json()).posts.find(item => item.id === post.id));
    assert.equal((await request(`/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...stale, title: 'Stale edit' }) })).status, 409);
    const html = await (await request(`/editorials/${post.slug}`)).text();
    assert.ok(html.includes(title) && html.includes('<blockquote>') && html.includes('narrative-statement'));
    assert.ok(html.includes('BlogPosting') && html.includes('og:image'));
    assert.ok((await (await request('/sitemap.xml')).text()).includes(post.slug));
    const originalSlug = post.slug;
    ({ post } = await (await request(`/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...post, title: title + ' edited' }) })).json());
    assert.equal(post.slug, originalSlug);
    await stop(); await start();
    assert.equal((await request('/api/admin/posts')).status, 200, 'session survives restart');
    assert.equal((await request(`/api/posts/${post.slug}`)).status, 200, 'published post survives restart');
    assert.deepEqual(Buffer.from(await (await request(cover)).arrayBuffer()), image, 'uploaded image survives restart');
    ({ post } = await (await request(`/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...post, status: 'draft' }) })).json());
    assert.equal((await request(`/api/posts/${post.slug}`)).status, 404);
    assert.equal((await request(`/api/admin/posts/${post.id}`, { method: 'DELETE' })).status, 200);
    assert.ok(!(await (await request('/api/admin/posts')).json()).posts.find(item => item.id === post.id));
    assert.equal((await request('/api/admin/logout', { method: 'POST' })).status, 200);
  } finally { await stop(); }
});
