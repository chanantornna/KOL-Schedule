import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/
// so assets must be referenced under that sub-path. The workflow passes the
// repo name via VITE_BASE. Locally (dev) it falls back to "/".
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    // Listen on all network interfaces so other devices (phone/tablet)
    // on the same Wi-Fi can reach the dev server via the machine's LAN IP.
    host: true,
    port: 5173,
  },
});
