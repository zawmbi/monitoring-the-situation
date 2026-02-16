import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env from repo root (parent of frontend/) so .env is found
  const rootDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, rootDir, '');

  const backendPort = env.BACKEND_PORT || env.PORT || '4100';
  // Use 127.0.0.1 instead of localhost to avoid IPv6 ECONNREFUSED on Windows
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  // Vite's import.meta.env handling is special — using `define` with
  // import.meta.env.* keys gets overridden by Vite's built-in env plugin.
  // Instead, inject a __ROOT_ENV__ global that config.js reads directly.
  const viteEnv = {};
  for (const [key, val] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      viteEnv[key] = val;
    }
  }

  return {
    plugins: [react()],
    envDir: rootDir,
    define: {
      __ROOT_ENV__: JSON.stringify(viteEnv),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        'react': path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@vis.gl/react-maplibre', 'maplibre-gl'],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: `ws://127.0.0.1:${backendPort}`,
          ws: true,
        },
      },
    },
  };
});
