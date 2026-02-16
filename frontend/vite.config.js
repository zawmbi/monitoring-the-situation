import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse a .env file into a key-value object, skipping comments and blanks
function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;
  const lines = readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '..');
  const envFile = path.resolve(rootDir, '.env');

  // Read .env directly from disk — loadEnv and envDir are unreliable
  // in Vite 7 when the .env lives outside the project root.
  const rawEnv = parseEnvFile(envFile);
  // Also try loadEnv as a fallback
  const viteLoadedEnv = loadEnv(mode, rootDir, '');
  const env = { ...viteLoadedEnv, ...rawEnv };

  const backendPort = env.BACKEND_PORT || env.PORT || '4100';
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  // Collect VITE_* vars for client-side injection
  const viteEnv = {};
  for (const [key, val] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      viteEnv[key] = val;
    }
  }

  // Log to terminal for debugging
  const envKeys = Object.keys(viteEnv);
  console.log(`[vite] Loaded ${envKeys.length} VITE_* vars from ${envFile} (exists: ${existsSync(envFile)})`);

  return {
    plugins: [react()],
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
