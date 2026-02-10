import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env from repo root (parent of frontend/) so .env is found
  const rootDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, rootDir, '');

  const backendPort = env.BACKEND_PORT || env.PORT || '4100';
  // Use 127.0.0.1 instead of localhost to avoid IPv6 ECONNREFUSED on Windows
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [react()],
    envDir: rootDir,
    resolve: {
      dedupe: ['react', 'react-dom', 'maplibre-gl'],
      alias: [
        { find: 'react', replacement: path.resolve(__dirname, '../node_modules/react') },
        { find: 'react-dom', replacement: path.resolve(__dirname, '../node_modules/react-dom') },
      ],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@vis.gl/react-maplibre', 'maplibre-gl'],
      esbuildOptions: {
        plugins: [{
          name: 'fix-maplibre-prebundle',
          setup(build) {
            // Fix: esbuild pre-bundling of the default maplibre-gl.js breaks class prototype
            // chains because its internal AMD-like define() module system confuses esbuild.
            // Map.prototype.setProjection (and other Map-own methods) become undefined.
            //
            // Solution: use the CSP build instead, which has a standard factory(exports)
            // pattern without the internal define() system. The CSP build requires a
            // separate worker file, so we inject a blob URL for it (same approach the
            // regular build uses internally).
            build.onLoad({ filter: /maplibre-gl[\\/]dist[\\/]maplibre-gl\.js$/ }, async (args) => {
              const dir = path.dirname(args.path);

              // Try the dev (non-minified) build first — available on some platforms
              const devPath = path.join(dir, 'maplibre-gl-dev.js');
              if (existsSync(devPath)) {
                return { contents: readFileSync(devPath, 'utf8'), loader: 'js' };
              }

              // Use CSP build (standard CJS pattern, no internal define() system)
              // + inject worker as blob URL
              const cspPath = path.join(dir, 'maplibre-gl-csp.js');
              const workerPath = path.join(dir, 'maplibre-gl-csp-worker.js');
              if (existsSync(cspPath) && existsSync(workerPath)) {
                const cspCode = readFileSync(cspPath, 'utf8');
                const workerCode = readFileSync(workerPath, 'utf8');
                // Append worker blob URL setup (mirrors what the regular build does internally)
                const combined = cspCode + '\n;(function(){if(typeof window!=="undefined"&&typeof module!=="undefined"&&module.exports&&module.exports.setWorkerUrl){var b=new Blob([' + JSON.stringify(workerCode) + '],{type:"text/javascript"});module.exports.setWorkerUrl(URL.createObjectURL(b));}})();\n';
                return { contents: combined, loader: 'js' };
              }

              // Last resort: return null to let esbuild handle the original file
              return null;
            });
          }
        }]
      }
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
