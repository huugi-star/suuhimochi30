import { nitro } from 'nitro/vite';
import rsc from '@vitejs/plugin-rsc';
import vinext from 'vinext';
import { defineConfig } from 'vite';
// Nitro supplies the Vercel server and static-asset output. It auto-detects
// Vercel in CI; setting NITRO_PRESET=vercel locally produces the same output.
export default defineConfig(({ command }) => ({
  // Keep development dependency optimization separate from production builds.
  // Vinext's browser/RSC entries are virtual modules, and reusing a build cache
  // in dev can leave those entries pointing at an environment with no runner.
  cacheDir: command === 'serve' ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
  plugins: [
    vinext({ rsc: false }),
    rsc({
      entries: {
        rsc: 'virtual:vinext-rsc-entry',
        ssr: 'virtual:vinext-app-ssr-entry',
        client: 'virtual:vinext-app-browser-entry',
      },
      // Nitro owns the development request handler. Registering the RSC
      // handler as well makes both plugins compete for the same environment
      // and leaves the RSC environment without Vite's module runner.
      serverHandler: false,
    }),
    nitro(),
  ],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
}));
