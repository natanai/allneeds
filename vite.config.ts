/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    proxy: {
      '/allneeds-api': {
        target: 'https://backend.allneeds.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/allneeds-api/, '/api'),
      },
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('src/data/generated/legacyData.json')) return 'catalog-data';
          return undefined;
        },
      },
    },
  },
  test: {
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**',
      'legacy-nvc-app/**',
      '.nvc-current-*/**',
      '.codex-publish-*/**',
    ],
  },
});
