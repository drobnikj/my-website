import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // Proxy API requests to Cloudflare Pages Functions dev server
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        timeout: 30000,
      },
    },
  },
});
