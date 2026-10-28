/** Server-side SQL adapter. SQL values are bound parameters, never interpolated. */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { verifyPassword } from './password.ts';
import type { SessionReader, SessionRecord } from './session.ts';
export type Query = (text: string, values: (string | number | null)[]) => Promise<Record<string, unknown>[]>;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const rolesAllowed = new Set(['super_admin', 'admin', 'promoter', 'member', 'affiliate', 'instructor']);
// Fixed valid encoding ensures unknown accounts still incur password verification cost.
const dummyHash = `scrypt$32768$8$1$${'00'.repeat(16)}$${'00'.repeat(64)}`;
export class IdentityStore implements SessionReader {
  private query: Query;
  constructor(query: Query) { this.query = query; }

  /** Trusted provisioning only; never expose this directly to public registration. */
  async createAccount(email: string, passwordHash: string, roles: string[], promoterCode: string | null = null) {
    email = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || !/^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(passwordHash)
      || !roles.length || roles.some(role => !rolesAllowed.has(role))
      || (promoterCode !== null && !promoterCode.trim())) throw new Error('Invalid account');
    const id = randomUUID();
    // One statement: duplicate role/mapping/email failure rolls back the entire account.
    // Cast serialized JSON through text so postgres.js does not JSON-encode the string again.
    await this.query(`WITH account AS (
      INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3) RETURNING id
    ), roles AS (
      INSERT INTO platform_user_roles(user_id,role)
      SELECT id,jsonb_array_elements_text($4::text::jsonb) FROM account
    ) INSERT INTO platform_promoter_accounts(user_id,promoter_code)
      SELECT id,$5 FROM account WHERE $5::text IS NOT NULL`,
      [id, email, passwordHash, JSON.stringify([...new Set(roles)]), promoterCode]);
    return id;
  }
  async consumeLoginAttempt(email: string): Promise<boolean> {
    const rows = await this.query(`INSERT INTO platform_login_attempts(key_hash,attempts,reset_at)
      VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key_hash) DO UPDATE SET
      attempts=CASE WHEN platform_login_attempts.reset_at<=now() THEN 1 ELSE platform_login_attempts.attempts+1 END,
      reset_at=CASE WHEN platform_login_attempts.reset_at<=now() THEN now()+interval '15 minutes' ELSE platform_login_attempts.reset_at END
      RETURNING attempts`, [digest(normalizeEmail(email))]);
    return Number(rows[0].attempts) <= 6;
  }
  async login(email: string, password: string, adminOnly = false): Promise<{token: string; expiresAt: number} | null> {
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return null;
    email = normalizeEmail(email);
    if (!await this.consumeLoginAttempt(email)) throw new Error('RATE_LIMITED');
    const [user] = await this.query(`SELECT id,password_hash,active FROM platform_users u WHERE email=$1
      AND ($2=0 OR EXISTS (SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin')))`, [email, adminOnly ? 1 : 0]);
    const valid = await verifyPassword(password, user ? String(user.password_hash) : dummyHash);
    if (!valid || !user || user.active !== true) return null;
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    // Serialize issuance with account resets: both lock the user before touching sessions.
    // If a reset wins, READ COMMITTED rechecks active/hash after waiting for its row lock;
    // if issuance wins, the later reset sees this committed session and revokes it.
    // Keep the lock and INSERT in one statement, without holding a lock during scrypt.
    const rows = await this.query(`WITH locked_user AS MATERIALIZED (
      SELECT id FROM platform_users
      WHERE id=$3 AND active=true AND password_hash=$4
      AND ($5=0 OR EXISTS (SELECT 1 FROM platform_user_roles r WHERE r.user_id=platform_users.id AND r.role IN ('admin','super_admin')))
      FOR UPDATE
    ) INSERT INTO platform_sessions(token_hash,user_id,expires_at)
      SELECT $1,id,$2::timestamptz FROM locked_user RETURNING token_hash`,
      [digest(token), new Date(expiresAt).toISOString(), String(user.id), String(user.password_hash), adminOnly ? 1 : 0]);
    return rows.length ? { token, expiresAt } : null;
  }
  /** Operator credential check: applies the shared throttle, never issues a session. */
  async verifyCredentials(email: string, password: string, adminOnly = false): Promise<string | null> {
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return null;
    email = normalizeEmail(email);
    if (!await this.consumeLoginAttempt(email)) throw new Error('RATE_LIMITED');
    const [user] = await this.query(`SELECT id,password_hash,active FROM platform_users u WHERE email=$1
      AND ($2=0 OR EXISTS (SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin')))`, [email, adminOnly ? 1 : 0]);
    const valid = await verifyPassword(password, user ? String(user.password_hash) : dummyHash);
    return valid && user?.active === true ? String(user.id) : null;
  }
  /** Repeated deploy/provision never resets a password, reactivates, or elevates an existing user. */
  async provisionAccount(email: string, passwordHash: string, roles: string[], promoterCode: string | null = null) {
    email = normalizeEmail(email);
    const [existing] = await this.query('SELECT id FROM platform_users WHERE email=$1', [email]);
    if (existing) return { userId: String(existing.id), created: false };
    try { return { userId: await this.createAccount(email, passwordHash, roles, promoterCode), created: true }; }
    catch (error) {
      const [concurrent] = await this.query('SELECT id FROM platform_users WHERE email=$1', [email]);
      if (concurrent) return { userId: String(concurrent.id), created: false };
      throw error;
    }
  }
  async logout(token: string): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(token)) return;
    await this.query('UPDATE platform_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_hash=$1', [digest(token)]);
  }
  async findSession(tokenHash: string): Promise<SessionRecord | null> {
    const [row] = await this.query(`SELECT s.token_hash,s.user_id,s.expires_at,s.revoked_at,u.active,u.email,
      p.promoter_code, COALESCE((SELECT json_agg(r.role ORDER BY r.role)
      FROM platform_user_roles r WHERE r.user_id=u.id),'[]'::json) AS roles
      FROM platform_sessions s JOIN platform_users u ON u.id=s.user_id
      LEFT JOIN platform_promoter_accounts p ON p.user_id=u.id WHERE s.token_hash=$1`, [tokenHash]);
    if (!row) return null;
    return { tokenHash: String(row.token_hash), userId: String(row.user_id),
      expiresAt: new Date(row.expires_at as string).getTime(),
      revokedAt: row.revoked_at === null ? null : new Date(row.revoked_at as string).getTime(),
      account: { userId: String(row.user_id), email: String(row.email), active: row.active === true,
        roles: row.roles as string[], promoterCode: row.promoter_code === null ? null : String(row.promoter_code) } };
  }
}
