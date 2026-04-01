import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/crypto/**/*.ts'
      ],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/types/**'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 85,
        lines: 90
      }
    },
    server: {
      deps: {
        inline: ['argon2-browser']
      }
    }
  },
  resolve: {
    alias: {
      '@crypto': resolve(__dirname, 'client/src/crypto'),
      '@types': resolve(__dirname, 'client/src/types')
    }
  }
});
