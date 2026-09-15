import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base ถูกกำหนดผ่าน env VITE_BASE ตอน build บน GitHub Actions
// เช่น /KOL-Schedule/scoring/ เพื่อวางแอพไว้ที่ subpath ของ GitHub Pages
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
