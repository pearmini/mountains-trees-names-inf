import {tree} from "../tree.js";

const EXPORT_OPTIONS = {
  grid: false,
  padding: 0,
  number: false,
  line: false,
  end: false,
  stampCellSize: 80,
};
const PAPER = "#f6d87b";
const EXPORT_SIZE = 480;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
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
  const svgBlob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
  const dataUrl = await blobToDataUrl(svgBlob);
  const image = await loadImage(dataUrl);
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = image.width * dpr;
  canvas.height = image.height * dpr;
  const context = canvas.getContext("2d");
  context.scale(dpr, dpr);
  context.fillStyle = PAPER;
  context.fillRect(0, 0, image.width, image.height);
  context.drawImage(image, 0, 0, image.width, image.height);
  return canvasToBlob(canvas);
}
