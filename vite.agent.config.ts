import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/agent/index.ts",
      name: "OEGuideAgent",
      fileName: "agent",
      formats: ["iife"],
    },
    outDir: "dist/agent",
    emptyOutDir: true,
  },
});
