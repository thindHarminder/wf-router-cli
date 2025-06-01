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
});
