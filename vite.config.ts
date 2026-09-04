import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages 專案站台會放在子路徑 /<repo>/,用 VITE_BASE 設定;
// 本機開發或 Vercel/Cloudflare 放根目錄時留空即可。
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Travel APP",
        short_name: "Travel",
        start_url: ".",
        display: "standalone",
        background_color: "#f2ede1",
        theme_color: "#4c5a3f",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            // 內容 JSON:先讀網路,失敗時吃快取 → 出國斷網也能看
            urlPattern: ({ url }) => url.pathname.includes("/data/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "trip-content",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/images/"),
            handler: "CacheFirst",
            options: {
              cacheName: "trip-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 }
            }
          }
        ]
      }
    })
  ]
});
