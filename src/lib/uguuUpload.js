const UGUU_UPLOAD = "https://uguu.se/upload";

export async function uploadPngToUguu(bytes, filename) {
  const blob = new Blob([bytes], {type: "image/png"});
  const form = new FormData();
  form.append("files[]", blob, filename);

  const response = await fetch(UGUU_UPLOAD, {method: "POST", body: form});
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  const payload = await response.json();
  const url = payload?.files?.[0]?.url;
  if (!payload?.success || typeof url !== "string" || !url.startsWith("http")) {
    throw new Error("Unexpected response from upload service.");
  }

  return url;
}
