import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Vediccare - Ayurvedic Healthcare",
        short_name: "Vediccare",
        description: "AI-powered Ayurvedic healthcare platform",
        theme_color: "#C85A17",
        background_color: "#F7F3EE",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(rootDir, "./src") },
  },
});
