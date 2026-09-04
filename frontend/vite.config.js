import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],

  // Vite only exposes variables that start with an approved prefix. The default
  // is VITE_ only, which is why AVIORA_API_BASE_URL was invisible and
  // import.meta.env.VITE_API_BASE_URL came back undefined.
  //
  // Listing both keeps any VITE_ variable working while AVIORA_ becomes the
  // project convention.
  envPrefix: ['VITE_', 'AVIORA_'],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7215',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})