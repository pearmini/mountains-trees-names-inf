const LITTERBOX_UPLOAD = "https://litterbox.catbox.moe/resources/internals/api.php";
const LITTERBOX_EXPIRY = "24h";

function slugify(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tree"
  );
}

export async function uploadTreePng(blob, name) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("time", LITTERBOX_EXPIRY);
  form.append("fileToUpload", blob, `${slugify(name)}-${Date.now()}.png`);

  const response = await fetch(LITTERBOX_UPLOAD, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  const url = (await response.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error("Unexpected response from upload service.");
  }

  return url;
}
