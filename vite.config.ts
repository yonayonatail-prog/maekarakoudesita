import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  // 3D アセット（.glb / .ply）を静的にバンドルできるよう許可
  assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.ply"],
});
