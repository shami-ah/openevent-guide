import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/sdk/index.ts",
      name: "OpenEventGuide",
      fileName: "sdk",
      formats: ["iife"],
    },
    outDir: "dist/sdk",
    emptyOutDir: true,
  },
});
