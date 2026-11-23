import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Em desenvolvimento, as chamadas para /api vão para o backend FastAPI.
// No Docker, API_PROXY_TARGET aponta para o nome do serviço do backend.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiProxyTarget,
    },
  },
})
