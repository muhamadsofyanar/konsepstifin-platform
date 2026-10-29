import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import postgres from 'postgres';
const globalForIntegrationDatabase = globalThis as unknown as { konsepIntegrationSql?: ReturnType<typeof postgres> };
const databaseConfigured = () => Boolean(process.env.DATABASE_URL);
function getDatabaseClient() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum dikonfigurasi.');
  if (!globalForIntegrationDatabase.konsepIntegrationSql) globalForIntegrationDatabase.konsepIntegrationSql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 20, connect_timeout: 10, prepare: false });
  return globalForIntegrationDatabase.konsepIntegrationSql!;
}

type MootaConfig = { baseUrl: string; apiToken: string; webhookSecret: string; bankAccountId: string; receiveMoneyCreatePath: string; bankAccountField: string; timeoutMs: number };
type StarSenderConfig = { apiKey: string; apiUrl: string };
export type IntegrationConfig = { moota: MootaConfig; starsender: StarSenderConfig };
export type PublicIntegrationSettings = {
  moota: { baseUrl: string; apiTokenConfigured: boolean; webhookSecretConfigured: boolean; bankAccountId: string; receiveMoneyCreatePath: string; bankAccountField: string; timeoutMs: number };
  starsender: { apiKeyConfigured: boolean; apiUrl: string };
};

const envConfig = (): IntegrationConfig => ({
  moota: {
    baseUrl: (process.env.MOOTA_API_BASE_URL || 'https://app.moota.co').trim(),
    apiToken: (process.env.MOOTA_API_TOKEN || '').trim(),
    webhookSecret: (process.env.MOOTA_WEBHOOK_SECRET || '').trim(),
    bankAccountId: (process.env.MOOTA_BANK_ACCOUNT_ID || '').trim(),
    receiveMoneyCreatePath: (process.env.MOOTA_RECEIVE_MONEY_CREATE_PATH || '').trim(),
    bankAccountField: (process.env.MOOTA_BANK_ACCOUNT_FIELD || 'bank_id').trim(),
    timeoutMs: Math.min(30000, Math.max(3000, Number(process.env.MOOTA_API_TIMEOUT_MS) || 12000)),
  },
  starsender: {
    apiKey: (process.env.STARSENDER_API_KEY || '').trim(),
    apiUrl: (process.env.STARSENDER_API_URL || 'https://api.starsender.online/api/send').trim(),
  },
});

function encryptionKey() {
  // DATABASE_URL is server-only and stable across normal redeploys. If it changes,
  // re-enter the integration secrets from the admin settings screen.
  const seed = process.env.DATABASE_URL;
  if (!seed) throw new Error('DATABASE_URL wajib tersedia untuk menyimpan secret integrasi secara terenkripsi.');
  return scryptSync(seed, 'konsepstifin-platform-integrations-v1', 32);
}
function encrypt(value: IntegrationConfig) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}
function decrypt(row: Record<string, unknown>): IntegrationConfig {
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(String(row.iv), 'base64'));
  decipher.setAuthTag(Buffer.from(String(row.auth_tag), 'base64'));
  const raw = Buffer.concat([decipher.update(Buffer.from(String(row.ciphertext), 'base64')), decipher.final()]).toString('utf8');
  const value = JSON.parse(raw) as Partial<IntegrationConfig>;
  const fallback = envConfig();
  return {
    moota: { ...fallback.moota, ...(value.moota || {}) },
    starsender: { ...fallback.starsender, ...(value.starsender || {}) },
  };
}
async function storedConfig(): Promise<IntegrationConfig | null> {
  if (!databaseConfigured()) return null;
  try {
    const sql = getDatabaseClient();
    const [row] = await sql`SELECT iv,ciphertext,auth_tag FROM platform_integrations WHERE provider='all' LIMIT 1`;
    if (!row) return null;
    try { return decrypt(row as Record<string, unknown>); } catch { return null; }
  } catch (error) {
    // Keep compatibility with deployments before migration 012; never log secret values.
    if (error instanceof Error && /platform_integrations|relation .* does not exist/i.test(error.message)) return null;
    throw error;
  }
}
export async function getIntegrationConfig(): Promise<IntegrationConfig> {
  return (await storedConfig()) || envConfig();
}
export async function getPublicIntegrationSettings(): Promise<PublicIntegrationSettings> {
  const c = await getIntegrationConfig();
  return {
    moota: { baseUrl: c.moota.baseUrl, apiTokenConfigured: Boolean(c.moota.apiToken), webhookSecretConfigured: Boolean(c.moota.webhookSecret), bankAccountId: c.moota.bankAccountId, receiveMoneyCreatePath: c.moota.receiveMoneyCreatePath, bankAccountField: c.moota.bankAccountField, timeoutMs: c.moota.timeoutMs },
    starsender: { apiKeyConfigured: Boolean(c.starsender.apiKey), apiUrl: c.starsender.apiUrl },
  };
}
function safeUrl(value: unknown, label: string) {
  const raw = String(value ?? '').trim();
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error(`${label} harus berupa URL yang valid.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error(`${label} harus menggunakan HTTPS dan tidak boleh berisi kredensial.`);
  return url.toString().replace(/\/$/, '');
}
export async function saveIntegrationSettings(actor: string, input: Record<string, unknown>) {
  const current = await getIntegrationConfig();
  const clear = Array.isArray(input.clearSecrets) ? input.clearSecrets.map(String) : [];
  const mootaInput = input.moota && typeof input.moota === 'object' ? input.moota as Record<string, unknown> : {};
  const senderInput = input.starsender && typeof input.starsender === 'object' ? input.starsender as Record<string, unknown> : {};
  const secret = (next: unknown, old: string, key: string) => clear.includes(key) ? '' : String(next ?? '').trim() || old;
  const moota: MootaConfig = {
    baseUrl: safeUrl(mootaInput.baseUrl ?? current.moota.baseUrl, 'URL dasar Moota'),
    apiToken: secret(mootaInput.apiToken, current.moota.apiToken, 'moota.apiToken'),
    webhookSecret: secret(mootaInput.webhookSecret, current.moota.webhookSecret, 'moota.webhookSecret'),
    bankAccountId: String(mootaInput.bankAccountId ?? current.moota.bankAccountId).trim().slice(0, 200),
    receiveMoneyCreatePath: String(mootaInput.receiveMoneyCreatePath ?? current.moota.receiveMoneyCreatePath).trim().slice(0, 300),
    bankAccountField: String(mootaInput.bankAccountField ?? current.moota.bankAccountField).trim().slice(0, 80),
    timeoutMs: Math.min(30000, Math.max(3000, Number(mootaInput.timeoutMs ?? current.moota.timeoutMs) || 12000)),
  };
  if (moota.receiveMoneyCreatePath && (!moota.receiveMoneyCreatePath.startsWith('/') || moota.receiveMoneyCreatePath.startsWith('//') || /[\r\n]/.test(moota.receiveMoneyCreatePath))) throw new Error('Path Create Terima Uang harus berupa path internal yang dimulai dengan satu garis miring.');
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(moota.bankAccountField)) throw new Error('Nama field rekening Moota tidak valid.');
  const starsender: StarSenderConfig = {
    apiKey: secret(senderInput.apiKey, current.starsender.apiKey, 'starsender.apiKey'),
    apiUrl: safeUrl(senderInput.apiUrl ?? current.starsender.apiUrl, 'URL API StarSender'),
  };
  const config: IntegrationConfig = { moota, starsender };
  const encrypted = encrypt(config);
  const sql = getDatabaseClient();
  await sql.begin(async tx => {
    await tx`INSERT INTO platform_integrations(provider,iv,ciphertext,auth_tag,updated_by,updated_at)
      VALUES ('all',${encrypted.iv},${encrypted.ciphertext},${encrypted.tag},${actor}::uuid,now())
      ON CONFLICT(provider) DO UPDATE SET iv=EXCLUDED.iv,ciphertext=EXCLUDED.ciphertext,auth_tag=EXCLUDED.auth_tag,updated_by=EXCLUDED.updated_by,updated_at=now()`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${actor}::uuid,'integration.settings.updated','external-integrations',${JSON.stringify({mootaApiTokenConfigured:Boolean(moota.apiToken),mootaWebhookConfigured:Boolean(moota.webhookSecret),starsenderConfigured:Boolean(starsender.apiKey),clearedSecrets:clear})}::jsonb)`;
  });
  return getPublicIntegrationSettings();
}
