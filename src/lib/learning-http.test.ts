import { describe, expect, it, vi } from 'vitest';

// Identity uses Next.js server-only APIs; failure responses do not require a session.
vi.mock('@/lib/identity/server', () => ({ getAccountPrincipal: vi.fn() }));

import { learningFailure } from './learning-http';
import { LearningError } from './learning-service';

describe('learningFailure', () => {
  it('returns a safe message for invalid JSON', async () => {
    const response = learningFailure(new SyntaxError('internal JSON details'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'JSON tidak valid.' });
  });

  it('preserves a learning validation message', async () => {
    const response = learningFailure(new LearningError('Produk tidak ditemukan.'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Produk tidak ditemukan.' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it.each([new Error('private database details'), null, 'private details'])('hides unexpected errors (%s)', async (error) => {
    const response = learningFailure(error);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      message: 'Layanan belum dapat diakses. Silakan coba kembali atau hubungi pengelola.',
    });
  });
});
