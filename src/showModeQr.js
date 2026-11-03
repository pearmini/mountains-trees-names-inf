import QRCode from "qrcode";

const BAIRUI_URL = "https://bairui.dev/";
const QR_OPTIONS = {
  margin: 1,
  width: 80,
  color: {
    dark: "#1a1a1a",
    light: "#fefaf1",
  },
};

function getSiteUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("show", "true");
  return url.toString();
}

function createQrItem({label, url}) {
  const item = document.createElement("div");
  item.className = "show-mode-qr-item";

  const image = document.createElement("img");
  image.className = "show-mode-qr-code";
  image.alt = `${label} QR code`;

  const caption = document.createElement("span");
  caption.className = "show-mode-qr-label";
  caption.textContent = label;

  item.append(image, caption);
  void QRCode.toDataURL(url, QR_OPTIONS).then((dataUrl) => {
    image.src = dataUrl;
  });

  return item;
}

export function initShowModeQr() {
  const panel = document.createElement("aside");
  panel.className = "show-mode-qr-panel";
  panel.setAttribute("aria-label", "Scan to visit or find Bairui Su");
  panel.append(
    createQrItem({label: "Visit", url: getSiteUrl()}),
    createQrItem({label: "Bairui Su", url: BAIRUI_URL}),
  );
  document.body.appendChild(panel);
}
