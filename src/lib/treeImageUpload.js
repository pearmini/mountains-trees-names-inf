export function isTreeImageUploadConfigured() {
  return Boolean(import.meta.env.VITE_IMGBB_API_KEY);
}

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
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Take-home prints are not configured yet.");
  }

  const base64 = await blobToBase64(blob);
  const body = new FormData();
  body.append("key", apiKey);
  body.append("image", base64);
  body.append("name", slugify(name));

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body,
  });

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Could not upload tree image.");
  }

  return payload.data.url;
}
