// vite.config.ts
import tailwindcss from "file:///C:/Users/Desktop/Documents/GI/web/%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2map/doc%20track/node_modules/.pnpm/@tailwindcss+vite@4.1.14_vi_0bfd4ad0e849e4ce571c20bb6a963122/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/Desktop/Documents/GI/web/%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2map/doc%20track/node_modules/.pnpm/@vitejs+plugin-react@5.0.4__ecb14c0dd35732cecfec7da63d76639c/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "node:path";
import { defineConfig } from "file:///C:/Users/Desktop/Documents/GI/web/%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2map/doc%20track/node_modules/.pnpm/vite@7.1.9_@types+node@24.7_67bbd228fb1351016eb14b98f9cc4eb7/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///C:/Users/Desktop/Documents/GI/web/%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2map/doc%20track/node_modules/.pnpm/vite-plugin-pwa@1.3.0_vite@_e7f5303c667c79ffc8f066ddc1ad23ea/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Desktop\\Documents\\GI\\web\\\u0E2A\u0E32\u0E02\u0E32map\\doc track";
var plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: [
      "favicon.svg",
      "apple-touch-icon-v2.png",
      "icon-192-v2.png",
      "icon-512-v2.png"
    ],
    workbox: {
      globIgnores: ["**/fonts/**", "**/map-*.js", "**/map-*.css"]
    },
    manifest: {
      name: "ShipTrack \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07",
      short_name: "ShipTrack",
      description: "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E1E\u0E31\u0E2A\u0E14\u0E38\u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E32\u0E02\u0E32\u0E41\u0E25\u0E30\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
      theme_color: "#091426",
      background_color: "#091426",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        {
          src: "icon-192-v2.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "icon-512-v2.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    }
  })
];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "client", "src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "attached_assets")
    }
  },
  envDir: path.resolve(__vite_injected_original_dirname),
  root: path.resolve(__vite_injected_original_dirname, "client"),
  build: {
    // Deploy target for Vercel/static hosting: repoRoot/dist
    outDir: path.resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return void 0;
          if (id.includes("leaflet")) return "map";
          if (id.includes("qrcode")) return "qr";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("react") || id.includes("react-dom")) return "react";
          return "vendor";
        }
      }
    }
  },
  server: {
    port: 3e3,
    strictPort: false,
    // Will find next available port if 3000 is busy
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEZXNrdG9wXFxcXERvY3VtZW50c1xcXFxHSVxcXFx3ZWJcXFxcXHUwRTJBXHUwRTMyXHUwRTAyXHUwRTMybWFwXFxcXGRvYyB0cmFja1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGVza3RvcFxcXFxEb2N1bWVudHNcXFxcR0lcXFxcd2ViXFxcXFx1MEUyQVx1MEUzMlx1MEUwMlx1MEUzMm1hcFxcXFxkb2MgdHJhY2tcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0Rlc2t0b3AvRG9jdW1lbnRzL0dJL3dlYi8lRTAlQjglQUElRTAlQjglQjIlRTAlQjglODIlRTAlQjglQjJtYXAvZG9jJTIwdHJhY2svdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuY29uc3QgcGx1Z2lucyA9IFtcbiAgcmVhY3QoKSxcbiAgdGFpbHdpbmRjc3MoKSxcbiAgVml0ZVBXQSh7XG4gICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcbiAgICBpbmNsdWRlQXNzZXRzOiBbXG4gICAgICBcImZhdmljb24uc3ZnXCIsXG4gICAgICBcImFwcGxlLXRvdWNoLWljb24tdjIucG5nXCIsXG4gICAgICBcImljb24tMTkyLXYyLnBuZ1wiLFxuICAgICAgXCJpY29uLTUxMi12Mi5wbmdcIixcbiAgICBdLFxuICAgIHdvcmtib3g6IHtcbiAgICAgIGdsb2JJZ25vcmVzOiBbXCIqKi9mb250cy8qKlwiLCBcIioqL21hcC0qLmpzXCIsIFwiKiovbWFwLSouY3NzXCJdLFxuICAgIH0sXG4gICAgbWFuaWZlc3Q6IHtcbiAgICAgIG5hbWU6IFwiU2hpcFRyYWNrIFx1MjAxNCBcdTBFMjNcdTBFMzBcdTBFMUFcdTBFMUFcdTBFMTVcdTBFMzRcdTBFMTRcdTBFMTVcdTBFMzJcdTBFMjFcdTBFMjNcdTBFMzJcdTBFMjJcdTBFMDFcdTBFMzJcdTBFMjNcdTBFMkFcdTBFNDhcdTBFMDdcIixcbiAgICAgIHNob3J0X25hbWU6IFwiU2hpcFRyYWNrXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJcdTBFMjNcdTBFMzBcdTBFMUFcdTBFMUFcdTBFMTVcdTBFMzRcdTBFMTRcdTBFMTVcdTBFMzJcdTBFMjFcdTBFMUVcdTBFMzFcdTBFMkFcdTBFMTRcdTBFMzhcdTBFNDFcdTBFMjVcdTBFMzBcdTBFMjNcdTBFMzJcdTBFMjJcdTBFMDFcdTBFMzJcdTBFMjNcdTBFMkFcdTBFNDhcdTBFMDdcdTBFMDJcdTBFMkRcdTBFMDdcdTBFMkFcdTBFMzJcdTBFMDJcdTBFMzJcdTBFNDFcdTBFMjVcdTBFMzBcdTBFMUVcdTBFMTlcdTBFMzFcdTBFMDFcdTBFMDdcdTBFMzJcdTBFMTlcIixcbiAgICAgIHRoZW1lX2NvbG9yOiBcIiMwOTE0MjZcIixcbiAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiIzA5MTQyNlwiLFxuICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdFwiLFxuICAgICAgc3RhcnRfdXJsOiBcIi9cIixcbiAgICAgIGljb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzcmM6IFwiaWNvbi0xOTItdjIucG5nXCIsXG4gICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogXCJpY29uLTUxMi12Mi5wbmdcIixcbiAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIH0pXG5dO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJjbGllbnRcIiwgXCJzcmNcIiksXG4gICAgICBcIkBhc3NldHNcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiYXR0YWNoZWRfYXNzZXRzXCIpLFxuICAgIH0sXG4gIH0sXG4gIGVudkRpcjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUpLFxuICByb290OiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJjbGllbnRcIiksXG4gIGJ1aWxkOiB7XG4gICAgLy8gRGVwbG95IHRhcmdldCBmb3IgVmVyY2VsL3N0YXRpYyBob3N0aW5nOiByZXBvUm9vdC9kaXN0XG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJkaXN0XCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImxlYWZsZXRcIikpIHJldHVybiBcIm1hcFwiO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInFyY29kZVwiKSkgcmV0dXJuIFwicXJcIjtcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWNoYXJ0c1wiKSkgcmV0dXJuIFwiY2hhcnRzXCI7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiQHJhZGl4LXVpXCIpKSByZXR1cm4gXCJyYWRpeFwiO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0XCIpIHx8IGlkLmluY2x1ZGVzKFwicmVhY3QtZG9tXCIpKSByZXR1cm4gXCJyZWFjdFwiO1xuICAgICAgICAgIHJldHVybiBcInZlbmRvclwiO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIHN0cmljdFBvcnQ6IGZhbHNlLCAvLyBXaWxsIGZpbmQgbmV4dCBhdmFpbGFibGUgcG9ydCBpZiAzMDAwIGlzIGJ1c3lcbiAgICBob3N0OiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZYLE9BQU8saUJBQWlCO0FBQ3JaLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU0sVUFBVTtBQUFBLEVBQ2QsTUFBTTtBQUFBLEVBQ04sWUFBWTtBQUFBLEVBQ1osUUFBUTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsZUFBZTtBQUFBLE1BQ2I7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxhQUFhLENBQUMsZUFBZSxlQUFlLGNBQWM7QUFBQSxJQUM1RDtBQUFBLElBQ0EsVUFBVTtBQUFBLE1BQ1IsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osYUFBYTtBQUFBLE1BQ2IsYUFBYTtBQUFBLE1BQ2Isa0JBQWtCO0FBQUEsTUFDbEIsU0FBUztBQUFBLE1BQ1QsYUFBYTtBQUFBLE1BQ2IsV0FBVztBQUFBLE1BQ1gsT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLEtBQUs7QUFBQSxVQUNMLE9BQU87QUFBQSxVQUNQLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsT0FBTztBQUFBLFVBQ1AsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFFBQ1g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFxQixVQUFVLEtBQUs7QUFBQSxNQUN0RCxXQUFXLEtBQUssUUFBUSxrQ0FBcUIsaUJBQWlCO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRLEtBQUssUUFBUSxnQ0FBbUI7QUFBQSxFQUN4QyxNQUFNLEtBQUssUUFBUSxrQ0FBcUIsUUFBUTtBQUFBLEVBQ2hELE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUSxLQUFLLFFBQVEsa0NBQXFCLE1BQU07QUFBQSxJQUNoRCxhQUFhO0FBQUEsSUFDYixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixhQUFhLElBQUk7QUFDZixjQUFJLENBQUMsR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ3pDLGNBQUksR0FBRyxTQUFTLFNBQVMsRUFBRyxRQUFPO0FBQ25DLGNBQUksR0FBRyxTQUFTLFFBQVEsRUFBRyxRQUFPO0FBQ2xDLGNBQUksR0FBRyxTQUFTLFVBQVUsRUFBRyxRQUFPO0FBQ3BDLGNBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGNBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxFQUFHLFFBQU87QUFDN0QsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
