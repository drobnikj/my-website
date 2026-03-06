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
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy Error]:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Vite Proxy]:', req.method, req.url, '→', proxyReq.path);
          });
        },
      },
    },
  },
});
