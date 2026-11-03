import {uploadPngToUguu} from "../src/lib/uguuUpload.js";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const bytes = await readBody(req);
    if (!bytes.length) {
      res.status(400).json({error: "Missing image"});
      return;
    }
    const url = await uploadPngToUguu(bytes, filenameFrom(req));
    res.status(200).json({url});
  } catch (error) {
    res.status(502).json({error: error.message ?? "Upload failed"});
  }
}
