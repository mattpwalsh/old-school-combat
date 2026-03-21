import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

// https://vite.dev/config/
export default defineConfig({
  server: {
    cors: true,
  },
  plugins: [
    react(),
    {
      name: "dev-manifest",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/manifest.json", (_req, res) => {
          const manifest = JSON.parse(
            readFileSync("./public/manifest.json", "utf-8"),
          );
          manifest.name += " (dev)";
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(manifest, null, 2));
        });
      },
    },
  ],
});
