import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    maxWorkers: 2,
    testTimeout: 20000,
    hookTimeout: 20000,
    exclude: ['**/.next/**', '**/coverage/**', '**/node_modules/**', '**/.git/**', 'tests/identity/**', 'tests/*.test.mjs', 'tests/network/**/*.test.mjs'],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
