import {defineConfig} from "vite";
import {uploadPngToUguu} from "./src/lib/uguuUpload.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function filenameFrom(req) {
  const raw = String(req.headers["x-filename"] || "tree.png");
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return safe.toLowerCase().endsWith(".png") ? safe : `${safe || "tree"}.png`;
}

export default defineConfig({
  plugins: [
    {
      name: "upload-tree-api",
      configureServer(server) {
        server.middlewares.use("/api/upload-tree", async (req, res, next) => {
          if (req.method !== "POST") {
            next();
            return;
          }

          try {
            const bytes = await readBody(req);
            if (!bytes.length) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({error: "Missing image"}));
              return;
            }
            const url = await uploadPngToUguu(bytes, filenameFrom(req));
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({url}));
          } catch (error) {
            res.statusCode = 502;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({error: error.message ?? "Upload failed"}));
          }
        });
      },
    },
  ],
});
