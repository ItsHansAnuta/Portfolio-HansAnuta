import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function makeAuth({ password = '', passwordHash = '', secret = '', production = false }) {
  const configured = (password.length >= 12 || /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(passwordHash)) && secret.length >= 32;
  const fingerprint = createHash('sha256').update(passwordHash || password).digest('hex');
  const sign = value => createHmac('sha256', secret).update(value).digest('base64url');
  const equal = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
  const attempts = new Map();
  function authenticated(req) {
    if (!configured) return false;
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('hans_session='))?.slice(13);
    if (!cookie) return false;
    try {
      const [payload, signature] = cookie.split('.');
      if (!signature || !equal(sign(payload), signature)) return false;
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
      return session.exp > Date.now() && equal(session.fingerprint, fingerprint);
    } catch { return false; }
  }
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: production, path: '/' };
  return {
    configured, authenticated,
    require(req, res, next) {
      if (!configured) return res.status(503).json({ error: 'Publishing is not configured yet. Set the server credentials in Hostinger.' });
      if (!authenticated(req)) return res.status(401).json({ error: 'Please sign in to your publishing desk.' });
      next();
    },
    login(req, res) {
      if (!configured) return res.status(503).json({ error: 'Publishing is not configured yet. Set the server credentials in Hostinger.' });
      const key = req.ip;
      const now = Date.now();
      // Bound memory and expire records, including addresses that never return.
      for (const [ip, record] of attempts) if (record.until < now) attempts.delete(ip);
      const record = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
      if (record.count >= 8 || attempts.size > 10000) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
      const submitted = typeof req.body?.password === 'string' ? req.body.password : '';
      let valid = false;
      if (passwordHash) {
        const [, salt, hash] = passwordHash.split('$');
        valid = equal(scryptSync(submitted, salt, 64).toString('hex'), hash);
      } else valid = equal(createHash('sha256').update(submitted).digest('hex'), fingerprint);
      if (!valid) { attempts.set(key, { ...record, count: record.count + 1 }); return res.status(401).json({ error: 'That password did not match. Try again.' }); }
      attempts.delete(key);
      const payload = Buffer.from(JSON.stringify({ exp: now + 8 * 60 * 60 * 1000, fingerprint, nonce: randomBytes(16).toString('hex') })).toString('base64url');
      res.cookie('hans_session', `${payload}.${sign(payload)}`, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
      res.json({ authenticated: true });
    },
    logout(req, res) { res.clearCookie('hans_session', cookieOptions); res.json({ authenticated: false }); },
  };
}
