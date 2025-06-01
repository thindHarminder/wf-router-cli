import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [], // Add any default Vite plugins you want
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      strict: false,
    },
    cors: {
      origin: "*",
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: resolve(__dirname, "src/main.ts"), // Explicitly set the entry
      output: {
        entryFileNames: "index.js", // Always output as index.js
        // Optionally, you can also control chunk naming:
        // chunkFileNames: "chunks/[name]-[hash].js",
        // assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    emptyOutDir: true,
  },
});
