import QRCode from "qrcode";

const QR_OPTIONS = {
  margin: 2,
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

  const qrWrap = document.createElement("div");
  qrWrap.className = "tree-print-qr-wrap";

  const qrImage = document.createElement("img");
  qrImage.className = "tree-print-qr-code";
  qrImage.alt = `QR code to save ${name}`;
  void QRCode.toDataURL(imageUrl, QR_OPTIONS).then((dataUrl) => {
    qrImage.src = dataUrl;
  });

  const message = document.createElement("p");
  message.className = "modal-message tree-print-qr-message";
  message.textContent =
    "Scan with your phone to open and save your tree image. Show this to the host if you would like a print.";

  const link = document.createElement("a");
  link.className = "tree-print-qr-link";
  link.href = imageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open tree image";

  qrWrap.appendChild(qrImage);
  body.append(qrWrap, message, link);
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
