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
const EXPORT_PIXEL_SCALE = 2;

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

export function createTreeSvg(name, size = EXPORT_SIZE, {paper = PAPER, ...treeOptions} = {}) {
  const text = name.trim() || "Name To Tree";
  const node = tree(text, {...EXPORT_OPTIONS, ...treeOptions, width: size, height: size}).render();
  node.setAttribute("viewBox", `0 0 ${size} ${size}`);

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(size));
  background.setAttribute("height", String(size));
  background.setAttribute("fill", paper);
  node.insertBefore(background, node.firstChild);

  return node;
}

export async function renderTreePngBlob(name, size = EXPORT_SIZE, options = {}) {
  const paper = options.paper ?? PAPER;
  const pixelSize = size * EXPORT_PIXEL_SCALE;
  const svg = createTreeSvg(name, size, options);
  svg.setAttribute("width", String(pixelSize));
  svg.setAttribute("height", String(pixelSize));
  const serialized = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
  const dataUrl = await blobToDataUrl(svgBlob);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const context = canvas.getContext("2d");
  context.fillStyle = paper;
  context.fillRect(0, 0, pixelSize, pixelSize);
  context.drawImage(image, 0, 0, pixelSize, pixelSize);
  return canvasToBlob(canvas);
}

function treeFilename(name) {
  const base =
    name
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "tree";
  return base;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTreeSvg(name, size = EXPORT_SIZE) {
  const svg = createTreeSvg(name, size);
  const serialized = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
  downloadBlob(blob, `${treeFilename(name)}.svg`);
}

export async function downloadTreePng(name, size = EXPORT_SIZE) {
  const blob = await renderTreePngBlob(name, size);
  downloadBlob(blob, `${treeFilename(name)}.png`);
}
