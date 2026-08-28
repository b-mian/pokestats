import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Migrated from create-react-app. Kept compatible with the existing repo:
//  - env vars still use the REACT_APP_ prefix (see envPrefix)
//  - production output still lands in build/ (Dockerfile + FastAPI serve it)
export default defineConfig({
  plugins: [react()],
  envPrefix: "REACT_APP_",
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  build: {
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
});
