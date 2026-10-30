/** Validate URLs sent to the provider. No remote request is made by this helper. */
export function whatsappMediaUrl(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > 2000) throw new Error('URL lampiran tidak valid.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Gunakan URL HTTPS file yang dapat diakses StarSender.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') || host.includes(':') || host.endsWith('.local') || host === 'localhost' || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) throw new Error('Lampiran harus memakai URL HTTPS publik.');
  return url.toString();
}
