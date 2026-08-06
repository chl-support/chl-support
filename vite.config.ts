import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The design system is consumed straight from the Claude Design handoff bundle so
// there is exactly one source of truth for tokens and the Plus Jakarta Sans files.
const ds = fileURLToPath(
  new URL(
    './project/_ds/dhany-indraswara-design-system-58b8bd42-42bc-4def-9bde-2db6efb9b7af',
    import.meta.url,
  ),
)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ds': ds,
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { fs: { allow: ['.'] } },
})
