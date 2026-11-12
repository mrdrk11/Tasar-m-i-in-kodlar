import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the built site works from any folder or domain.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        menu: resolve(import.meta.dirname, 'menu.html'),
      },
    },
  },
  server: { host: '127.0.0.1' },
  preview: { host: '0.0.0.0' },
});
