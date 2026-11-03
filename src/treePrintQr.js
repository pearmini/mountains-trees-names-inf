import QRCode from "qrcode";

const QR_OPTIONS = {
  margin: 1,
  width: 240,
  color: {
    dark: "#1a1a1a",
    light: "#fefaf1",
  },
};

export function createTreePrintQrModal({name, imageUrl, onClose}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay modal-overlay-print-qr";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });

  const group = document.createElement("div");
  group.className = "modal-group modal-group-print-qr";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog modal-dialog-print-qr";
  dialog.addEventListener("click", (event) => event.stopPropagation());

  const header = document.createElement("div");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.className = "modal-title";
  heading.textContent = "Scan to save your tree";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "modal-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", onClose);

  header.append(heading, closeButton);

  const body = document.createElement("div");
  body.className = "modal-body modal-body-print-qr";

  const qrImage = document.createElement("img");
  qrImage.className = "tree-print-qr-code";
  qrImage.alt = `QR code to save ${name}`;
  void QRCode.toDataURL(imageUrl, QR_OPTIONS).then((dataUrl) => {
    qrImage.src = dataUrl;
  });

  body.appendChild(qrImage);
  dialog.append(header, body);
  group.appendChild(dialog);
  overlay.appendChild(group);

  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
  };
  document.addEventListener("keydown", onKeyDown);

  return {
    overlay,
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
    },
  };
}
