import {tree} from "../tree.js";

const EXPORT_OPTIONS = {grid: false, padding: 0, number: false, line: false, end: false};
const PAPER = "#f6d87b";
const EXPORT_SIZE = 1024;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png", 1));
}

export function createTreeSvg(name, size = EXPORT_SIZE) {
  const text = name.trim() || "Name To Tree";
  const node = tree(text, {...EXPORT_OPTIONS, width: size, height: size}).render();
  node.setAttribute("viewBox", `0 0 ${size} ${size}`);
  return node;
}

export async function renderTreePngBlob(name, size = EXPORT_SIZE) {
  const svg = createTreeSvg(name, size);
  const serialized = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context.fillStyle = PAPER;
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    return canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
