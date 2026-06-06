const CATBOX_URL = "https://catbox.moe/user/api.php";

export async function uploadTreeToCatbox(blob, name) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", blob, `${name}.png`);

  const response = await fetch(CATBOX_URL, {
    method: "POST",
    body: form,
  });
  const url = (await response.text()).trim();

  if (!url.startsWith("http")) {
    throw new Error("Could not upload tree image.");
  }

  return url;
}
