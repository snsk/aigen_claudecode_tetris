import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        format: 'iife',
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    // PWA disabled for local file execution
  ],
});