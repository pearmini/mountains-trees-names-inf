import {defineConfig} from "vite";
import {uploadTreeToCatbox} from "./src/lib/uploadTreeToCatbox.js";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function handleUploadTree(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({error: "Method not allowed"}));
    return;
  }

  try {
    const {image, name = "tree"} = await readJsonBody(req);
    if (!image) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({error: "Missing image"}));
      return;
    }

    const buffer = Buffer.from(image, "base64");
    const blob = new Blob([buffer], {type: "image/png"});
    const url = await uploadTreeToCatbox(blob, name);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({url}));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({error: error.message ?? "Upload failed"}));
  }
}

export default defineConfig({
  plugins: [
    {
      name: "upload-tree-api",
      configureServer(server) {
        server.middlewares.use("/api/upload-tree", (req, res) => {
          void handleUploadTree(req, res);
        });
      },
    },
  ],
});
