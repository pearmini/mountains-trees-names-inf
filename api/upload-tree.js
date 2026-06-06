const CATBOX_URL = "https://catbox.moe/user/api.php";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {image, name = "tree"} = request.body ?? {};
    if (!image) {
      response.status(400).json({error: "Missing image"});
      return;
    }

    const buffer = Buffer.from(image, "base64");
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", new Blob([buffer], {type: "image/png"}), `${name}.png`);

    const uploadResponse = await fetch(CATBOX_URL, {
      method: "POST",
      body: form,
    });
    const url = (await uploadResponse.text()).trim();

    if (!url.startsWith("http")) {
      response.status(502).json({error: "Upload failed"});
      return;
    }

    response.status(200).json({url});
  } catch (error) {
    response.status(500).json({error: error.message ?? "Upload failed"});
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};
