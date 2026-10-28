// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const api = vi.hoisted(() => ({ query: vi.fn(), action: vi.fn() }));
vi.mock('@/app/belajar/ui', async () => ({ ...await vi.importActual<typeof import('@/app/belajar/ui')>('@/app/belajar/ui'), query: api.query, action: api.action }));
import Admin from '../../src/app/admin/kelas/learning-admin';
import Portal from '../../src/app/belajar/portal';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => { api.query.mockImplementation(async (v: string) => v === 'view=admin' ? { products: [], lessons: [], grants: [], users: [{ id: 'u', email: 'client@example.test', active: true }], commissions: [], payouts: [], tickets: [], jobs: [], coupons: [] } : v === 'view=catalog' ? { products: [] } : { grants: [], progress: [], purchases: [], certificates: [], notifications: [], tickets: [] }); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ settings: {} }) }))); });
it('admin starts with compact overview and switches to one workspace at a time', async () => { render(<Admin />); await screen.findByRole('button', { name: 'Produk digital' }); expect(screen.queryByRole('heading', { name: 'Kupon' })).not.toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: 'Produk digital' })); expect(screen.getByText('Tambah produk')).toBeVisible(); expect(screen.queryByRole('heading', { name: 'Pencairan manual' })).not.toBeInTheDocument(); });
it('student sees one learning section and never sees partner commission navigation', async () => { render(<Portal signedIn roles={['member']}/>); await screen.findByRole('button', { name: 'Pembelian' }); expect(screen.queryByRole('link', { name: 'Komisi' })).not.toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: 'Pembelian' })); expect(screen.getByRole('heading', { name: 'Pembelian saya' })).toBeVisible(); expect(screen.queryByRole('heading', { name: 'Sertifikat saya' })).not.toBeInTheDocument(); });
it('keeps admin setup guidance out of member failure screens', async () => { api.query.mockRejectedValue(new Error('Periksa database dan migrasi')); render(<Portal signedIn roles={['member']}/>); expect(await screen.findByText('Data akun belum dapat dimuat. Coba kembali atau masuk ulang.')).toBeVisible(); expect(screen.queryByText(/IDENTITY_ADMIN_CONFIRM/)).not.toBeInTheDocument(); expect(screen.queryByText('Mulai perjalanan belajar Anda')).not.toBeInTheDocument(); });
it('finds older accounts outside the initial admin account list', async () => { const { AccountSelect } = await import('../../src/app/belajar/ui'); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ users: [{ id: 'old-user', email: 'older@example.test' }] }) }))); render(<AccountSelect name="userId" rows={[]}/>); await userEvent.type(screen.getByLabelText('Cari email peserta'), 'older'); expect(await screen.findByRole('option', { name: 'older@example.test' })).toBeInTheDocument(); });
it('reports a failed form save as an alert instead of a success message', async () => { const { Form } = await import('../../src/app/belajar/ui'); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ message: 'Tidak dapat menyimpan' }) }))); render(<Form title="Form uji" actionName="ticket" onDone={() => { }}><input name="subject" defaultValue="Uji"/></Form>); await userEvent.click(screen.getByText('Form uji')); await userEvent.click(screen.getByRole('button', { name: 'Simpan' })); expect(await screen.findByRole('alert')).toHaveTextContent('Tidak dapat menyimpan'); });
it('isolates compact learning headings from the public hero grid', async () => { const { readFileSync } = await import('node:fs'); const style = document.createElement('style'); style.textContent = '.hero{min-height:650px;display:grid;grid-template-columns:1fr 1fr}' + readFileSync('src/app/belajar/learning.css', 'utf8'); document.head.append(style); try {
    const { container } = render(<Admin />);
    const heading = container.querySelector('.lr-heading')!;
    expect(getComputedStyle(heading).display).toBe('flex');
    expect(getComputedStyle(heading).minHeight).toBe('0px');
    expect(container.querySelector('.hero')).toBeNull();
}
finally {
    style.remove();
} });
