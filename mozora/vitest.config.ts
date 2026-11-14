import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Repository root, resolved from this file so the command works from any directory.
    root: fileURLToPath(new URL('..', import.meta.url)),
    include: ['server/mozora/**/*.test.ts', 'mozora/scripts/**/*.test.ts'],
    setupFiles: ['mozora/test/setup.ts'],
    environment: 'node',
    // Unit tests never touch a real database or the network.
    env: { MOZORA_DATABASE_URL: '' },
  },
});
