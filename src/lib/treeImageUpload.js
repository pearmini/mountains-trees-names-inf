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
  const filename = `${slugify(name)}-${Date.now()}.png`;
  const response = await fetch("/api/upload-tree", {
    method: "POST",
    headers: {
      "content-type": blob.type || "image/png",
      "x-filename": filename,
    },
    body: blob,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `Upload failed (${response.status})`);
  }
  if (typeof payload.url !== "string" || !payload.url.startsWith("http")) {
    throw new Error("Unexpected response from upload service.");
  }

  return payload.url;
}
