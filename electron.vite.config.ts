import MillionLint from "@million/lint";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "node:path";
import UnoCSS from "unocss/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: "src/main.ts",
      },
      rollupOptions: {
        external: ["better-sqlite3", "node-unrar-js"],
      },
    },
    resolve: {
      alias: {
        "@src": resolve(__dirname, "src/"),
        "@shared": resolve(__dirname, "src/shared/"),
        "@core": resolve(__dirname, "src/shared/core/"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: "src/preload.ts",
      },
    },
  },
  renderer: {
    root: "src/web/",
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "src/shared/"),
        "@components": resolve(__dirname, "src/web/components/index.ts"),
        "@assets": resolve(__dirname, "src/assets/"),
        "@core": resolve(__dirname, "src/shared/core/"),
      },
    },
    plugins: [
      react(),
      UnoCSS(),
      TanStackRouterVite({
        routesDirectory: "./src/web/routes/",
        generatedRouteTree: "./src/web/routeTree.gen.ts",
      }),
      MillionLint.vite(),
    ],
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        input: "./src/web/index.html",
      },
    },
  },
});
