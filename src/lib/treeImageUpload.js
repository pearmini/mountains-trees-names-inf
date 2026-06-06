function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  const base64 = await blobToBase64(blob);
  const response = await fetch("/api/upload-tree", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      image: base64,
      name: slugify(name),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Could not upload tree image.");
  }

  return payload.url;
}
