import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/domain': resolve(__dirname, './src/domain'),
      '@/application': resolve(__dirname, './src/application'),
      '@/infrastructure': resolve(__dirname, './src/infrastructure'),
      '@/presentation': resolve(__dirname, './src/presentation'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});