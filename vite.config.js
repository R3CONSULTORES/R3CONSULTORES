import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Necesario para GitHub Pages si se despliega en una subcarpeta, 
  // pero R3 Consultores usa dominio personalizado, así que base es '/'
  base: '/',
})
