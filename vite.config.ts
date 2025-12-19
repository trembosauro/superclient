import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");
  const rawTarget =
    env.VITE_API_PROXY_TARGET || env.VITE_API_URL || "http://localhost:3005";
  const apiTarget = rawTarget.startsWith("/") ? "http://localhost:3005" : rawTarget;

  return {
    base: "/superclient/",
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      strictPort: false, // Will find next available port if 3000 is busy
      host: true,
      allowedHosts: ["localhost", "127.0.0.1"],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
