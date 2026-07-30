import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// NOTE:
 // - `server.proxy` works ONLY with `npm run dev` (local).
 // - On Vercel, use `vercel.json` rewrites and/or `VITE_API_URL` in `.env.production`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Local frontend → Railway API (or use http://localhost:3000 for a local Backend)
      '/api': 'https://attendencebackend-production.up.railway.app',
    },
  },
})
