import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* As rotas são de verdade (/galeria, /obra/cruz-fractal…): no servidor de
   desenvolvimento e no "preview", qualquer endereço volta para o
   index.html (appType "spa"). Na Vercel, o vercel.json faz o mesmo. */
export default defineConfig({
  plugins: [react()],
  appType: "spa",
  build: { target: "es2022", chunkSizeWarningLimit: 1800 },
  server: { port: 5200 },
  preview: { port: 5201 },
});
