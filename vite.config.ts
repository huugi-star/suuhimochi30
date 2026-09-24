import { nitro } from 'nitro/vite';
import vinext from 'vinext';
import { defineConfig } from 'vite';
// Nitro supplies the Vercel server and static-asset output. It auto-detects
// Vercel in CI; setting NITRO_PRESET=vercel locally produces the same output.
export default defineConfig({
  plugins: [vinext(), nitro()],
});
