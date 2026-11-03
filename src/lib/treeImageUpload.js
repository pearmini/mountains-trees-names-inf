const LITTERBOX_UPLOAD = "https://litterbox.catbox.moe/resources/internals/api.php";
const LITTERBOX_EXPIRY = "24h";
const TMPFILES_UPLOAD = "https://tmpfiles.org/api/v1/upload";

function slugify(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tree"
  );
}

async function uploadToLitterbox(blob, filename) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("time", LITTERBOX_EXPIRY);
  form.append("fileToUpload", blob, filename);

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

async function uploadToTmpfiles(blob, filename) {
  const form = new FormData();
  form.append("file", blob, filename);

  const response = await fetch(TMPFILES_UPLOAD, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  const payload = await response.json();
  const url = payload?.data?.url;
  if (typeof url !== "string" || !url.startsWith("http")) {
    throw new Error("Unexpected response from upload service.");
  }

  return url;
}

export async function uploadTreePng(blob, name) {
  const filename = `${slugify(name)}-${Date.now()}.png`;
  try {
    return await uploadToLitterbox(blob, filename);
  } catch {
    return await uploadToTmpfiles(blob, filename);
  }
}
