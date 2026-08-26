import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/widget/index.ts",
      name: "OEGuideWidget",
      fileName: "widget",
      formats: ["iife"],
    },
    outDir: "dist/widget",
    emptyOutDir: true,
  },
});
