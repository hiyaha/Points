/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" にすることで GitHub Pages のサブパス配下でも動作する
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
