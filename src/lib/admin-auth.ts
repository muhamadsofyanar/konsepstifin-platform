import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'konsepstifin_admin';
const SESSION_AGE_SECONDS = 8 * 60 * 60;

export const adminAuthConfigured = () => Boolean(
  process.env.ADMIN_EMAIL
  && process.env.ADMIN_PASSWORD
  && process.env.ADMIN_PASSWORD.length >= 12
  && process.env.ADMIN_SESSION_SECRET
  && process.env.ADMIN_SESSION_SECRET.length >= 32,
);

function safeEqual(first: string, second: string) {
  const left = createHash('sha256').update(first).digest();
  const right = createHash('sha256').update(second).digest();
  return timingSafeEqual(left, right);
}

function signature(payload: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET ?? '').update(payload).digest('base64url');
}

export function validateAdminCredentials(email: string, password: string) {
  if (!adminAuthConfigured()) return false;
  return safeEqual(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase())
    && safeEqual(password, process.env.ADMIN_PASSWORD!);
}

export async function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + SESSION_AGE_SECONDS * 1000,
  })).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_AGE_SECONDS,
    priority: 'high',
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  if (!adminAuthConfigured()) return false;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [payload, receivedSignature] = token.split('.');
  if (!payload || !receivedSignature || !safeEqual(receivedSignature, signature(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; expiresAt?: number };
    return parsed.email === process.env.ADMIN_EMAIL!.trim().toLowerCase()
      && typeof parsed.expiresAt === 'number'
      && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}
