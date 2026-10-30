/** Server only: fixed-cost scrypt, bounded input and random per-password salt. */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, options,
    (error, result) => error ? reject(error) : resolve(result)));
}
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024)
    throw new Error('Password must contain 12–1024 characters');
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$32768$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 1024 || typeof hash !== 'string') return false;
  const match = /^scrypt\$32768\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash);
  if (!match) return false;
  return timingSafeEqual(await derive(password, Buffer.from(match[1], 'hex')), Buffer.from(match[2], 'hex'));
}
