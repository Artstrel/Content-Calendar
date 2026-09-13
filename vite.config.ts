import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  }
});
