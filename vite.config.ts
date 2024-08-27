import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import envCompatible from 'vite-plugin-env-compatible';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
            wasm(),
            topLevelAwait(),
            envCompatible()
  ],
  optimizeDeps: {
    exclude: ['@emurgo/cardano-serialization-lib-browser']
  },
  build: {
    target: 'ES2020',
    sourcemap: true,
  },
  worker: {
    format: 'es'
   },
})
