import { defineConfig } from "vite";
import { resolve } from "path";
import glob from "fast-glob";

const pageFiles = glob.sync("src/pages/**/+page.ts");
const layoutFiles = glob.sync("src/pages/**/+layout.ts");

const input: Record<string, string> = {
  index: resolve(__dirname, "src/main.ts"),
};

for (const file of [...pageFiles, ...layoutFiles]) {
  // Remove "src/" and ".ts" for output path, keep folder structure
  const outPath = file.replace(/^src\//, "").replace(/\.ts$/, ".js");
  input[outPath] = resolve(__dirname, file);
}

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "webflow-router-kit": resolve(__dirname, "../src/index.ts"),
    },
  },
  server: {
    cors: {
      origin: "*",
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input,
      output: {
        entryFileNames: (chunk) => {
          // For main entry
          if (chunk.name === "index") return "index.js";
          // For pages/layouts, keep their relative path
          return "[name]";
        },
      },
    },
    emptyOutDir: true,
  },
});
