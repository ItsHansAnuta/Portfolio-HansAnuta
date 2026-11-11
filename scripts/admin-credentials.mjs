import { randomBytes, scryptSync } from 'node:crypto';

const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
console.log('Your generated dashboard password (save this in your password manager):');
console.log(password);
console.log('\nSet these SERVER environment variables in Hostinger:');
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt}$${hash}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString('base64url')}`);
console.log('\nThese are dashboard credentials, separate from the database login. Do not add them to GitHub.');
