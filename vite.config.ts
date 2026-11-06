import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { whop } from "@whop/cli/vite";
import path from "node:path";
import { handleApiRoute } from "./src/server/api";

function apiMiddlewarePlugin(): Plugin {
  return {
    name: "whop-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/")) {
          let body: Record<string, any> = {};
          if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(chunks).toString("utf-8");
            try {
              body = raw ? JSON.parse(raw) : {};
            } catch {
              body = {};
            }
          }

          try {
            const response = await handleApiRoute({
              method: req.method || "GET",
              url: req.url,
              body,
            });

            res.statusCode = response.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(response.data));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: (err as Error).message }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    apiMiddlewarePlugin(),
    whop(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/client",
  },
  server: {
    port: 3000,
  },
});
