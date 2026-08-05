import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    watch: {
      // No vigilar documentos cargados (PDF de reglamentos/circulares):
      // pueden estar abiertos/bloqueados y hacían caer el watcher (EBUSY).
      ignored: ["**/docs/**", "**/*.pdf"],
    },
  },
});
