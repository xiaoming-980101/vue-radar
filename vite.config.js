import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        skills: fileURLToPath(new URL('./skills.html', import.meta.url)),
        codexUses: fileURLToPath(new URL('./codex-uses.html', import.meta.url)),
      },
    },
  },
})
