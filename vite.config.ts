import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Essential for Electron: ensures assets are loaded via relative paths
    server: {
      port: 5173, // Default Vite port (matched in main.js)
      host: '0.0.0.0',
      proxy: {
        // Proxy for Tally Prime XML API to handle CORS
        '/tally': {
          target: 'http://127.0.0.1:9000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tally/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Tally proxy error:', err);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Tally proxy response:', proxyRes.statusCode);
            });
          }
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.VITE_TALLY_API_URL': JSON.stringify(env.VITE_TALLY_API_URL || 'http://127.0.0.1:9000')
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    }
  };
});
