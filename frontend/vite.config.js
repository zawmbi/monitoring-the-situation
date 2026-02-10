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
            // Fix: esbuild pre-bundling of the minified maplibre-gl.js (~1MB on ~3 lines)
            // breaks class prototype chains. Map.prototype.setProjection becomes undefined
            // at runtime even though the source code defines it.
            // Solution: load the non-minified dev build instead, which esbuild handles correctly.
            // Fallback: reformat the minified code by adding line breaks at class/method
            // boundaries so esbuild can properly parse the class bodies.
            build.onLoad({ filter: /maplibre-gl[\\/]dist[\\/]maplibre-gl\.js$/ }, async (args) => {
              // Try the dev (non-minified) build first
              const devPath = args.path.replace(/maplibre-gl\.js$/, 'maplibre-gl-dev.js');
              if (existsSync(devPath)) {
                return { contents: readFileSync(devPath, 'utf8'), loader: 'js' };
              }
              // Fallback: reformat minified code to break up mega-long lines
              let code = readFileSync(args.path, 'utf8');
              code = code
                .replace(/([=,;({])class\b/g, '$1\nclass ')
                .replace(/\}(\w+\s*\()/g, '}\n$1');
              return { contents: code, loader: 'js' };
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
