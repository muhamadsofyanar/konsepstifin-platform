export class CommerceError extends Error {}
export type CommerceLine = { name: string; unitPrice: number; quantity: number };
export const MAX_MONEY = 999_999_999_999;
export function validateMoney(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > MAX_MONEY) throw new CommerceError('Nominal harus bilangan Rupiah utuh antara 0 dan 999.999.999.999.');
  return value;
}
export function calculateLines(value: unknown): { lines: CommerceLine[]; total: number } {
  if (!Array.isArray(value) || !value.length || value.length > 50) throw new CommerceError('Isi 1–50 item pesanan.');
  const lines = value.map((item) => {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    if (!name || name.length > 200) throw new CommerceError('Nama item wajib diisi, maksimum 200 karakter.');
    const unitPrice = validateMoney(item.unitPrice);
    const quantity = item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) throw new CommerceError('Jumlah harus bilangan bulat 1–10.000.');
    return { name, unitPrice, quantity };
  });
  const total = validateMoney(lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  if (!total) throw new CommerceError('Total pesanan harus lebih dari nol.');
  return { lines, total };
}
export function paymentStatus(total: number, balance: number) { return balance === total ? 'paid' : balance > 0 ? 'partial' : 'unpaid'; }
