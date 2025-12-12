import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  mode: 'development',  // Assicurati che l'app venga eseguita in modalità sviluppo
  build: {
    minify: false, // Disabilita la minificazione del codice
  },
})
