import {rankIndexForDbId, render} from "./render.js";
import {prepareTreeForGrow, animateTreeGrow} from "./animateTree.js";
import {initShowModeQr} from "./showModeQr.js";
import {initUI} from "./ui.js";
import {landscapeIncludesArchive, parseLandscape} from "./lib/landscapeMode.js";
import {
  addLandscapeTree,
  deleteLandscapeTree,
  fetchLandscapeTrees,
} from "./lib/landscapeTreesApi.js";
import {inject} from "@vercel/analytics";

const urlParams = new URLSearchParams(window.location.search);
const showMode = urlParams.get("show") === "true";
let landscape = parseLandscape(urlParams.get("landscape"));
let includeArchive = landscapeIncludesArchive(landscape);

if (showMode) {
  document.body.classList.add("show-mode");
  initShowModeQr();
}

inject();

function parseSeedFromUrl(params = urlParams) {
  const seedParam = params.get("seed");
  if (seedParam != null && seedParam !== "" && Number.isFinite(Number(seedParam))) {
    return Number(seedParam) >>> 0;
  }
  return null;
}

function syncSeedToUrl(seed) {
  const params = new URLSearchParams(window.location.search);
  params.set("seed", String(seed));
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

let currentController = null;
let userTrees = [];
let setInteractionBlocked = () => {};
let updateTreeCounts = () => {};
let syncLandscapeControl = () => {};
let landscapeRequest = 0;
let currentSeed = parseSeedFromUrl();
let centerRankIndex = 0;
if (currentSeed == null) {
  currentSeed = Date.now() >>> 0;
  syncSeedToUrl(currentSeed);
}

function regenerateLandscape() {
  currentSeed = Date.now() >>> 0;
  centerRankIndex = 0;
  syncSeedToUrl(currentSeed);
  createAndRender({panToOrigin: true});
}

function focusRank(rankIndex) {
  if (rankIndex < 0) return;
  centerRankIndex = rankIndex;
  createAndRender();
}

function focusTree(dbId) {
  focusRank(rankIndexForDbId(userTrees, dbId, {includeArchive}));
}

async function loadUserTrees() {
  const mode = landscape;
  try {
    const trees = await fetchLandscapeTrees(mode);
    if (mode === landscape) userTrees = trees;
  } catch (error) {
    console.error("Failed to load community trees:", error);
    if (mode === landscape) userTrees = [];
  }
  return userTrees;
}

async function applyLandscape(next, {updateHistory = false, seed = undefined} = {}) {
  const parsed = parseLandscape(next);
  const seedChanged = seed != null && seed !== currentSeed;
  const request = ++landscapeRequest;
  if (parsed === landscape && !seedChanged) {
    syncLandscapeControl(landscape);
    return;
  }

  const trees = parsed === landscape ? userTrees : await fetchLandscapeTrees(parsed);
  if (request !== landscapeRequest) return;

  if (seedChanged) currentSeed = seed;
  if (parsed !== landscape) {
    landscape = parsed;
    includeArchive = landscapeIncludesArchive(landscape);
    userTrees = trees;
    centerRankIndex = 0;
  }
  if (updateHistory) {
    const params = new URLSearchParams(window.location.search);
    params.set("landscape", landscape);
    const query = params.toString();
    history.pushState(null, "", query ? `?${query}` : window.location.pathname);
  }
  createAndRender({panToOrigin: true});
  syncLandscapeControl(landscape);
  updateTreeCounts();
}

function createAndRender({panToOrigin = false} = {}) {
  const container = document.querySelector("#container");
  if (currentController?.node) {
    container.removeChild(currentController.node);
  }

  currentController = render({
    width: window.innerWidth,
    seed: currentSeed,
    userTrees,
    centerRankIndex,
    includeArchive,
  });

  container.appendChild(currentController.node);

  if (panToOrigin) {
    requestAnimationFrame(() => currentController.panToCenter());
  }
}

async function refreshUserTrees() {
  const mode = landscape;
  await loadUserTrees();
  if (mode !== landscape) return userTrees;
  if (currentController) {
    currentController.setUserTrees(userTrees);
  }
  updateTreeCounts();
  return userTrees;
}

async function bootstrap() {
  const request = ++landscapeRequest;
  await loadUserTrees();
  if (request === landscapeRequest) createAndRender();

  ({setInteractionBlocked, updateTreeCounts, syncLandscapeControl} = initUI({
    showMode,
    landscape,
    getUserTrees: () => userTrees,
    getCommunityTreeCount: () => userTrees.length,
    refreshUserTrees,
    onRegenerateLandscape: regenerateLandscape,
    onLandscapeChange: (next) => applyLandscape(next, {updateHistory: true}),
    onAdd: async (name) => {
      if (landscape === "itp25" || landscape === "uist26") {
        throw new Error("This landscape does not accept new trees.");
      }
      const added = await addLandscapeTree(name, landscape);
      userTrees = [added, ...userTrees.filter((tree) => tree.id !== added.id)];
      updateTreeCounts();
      focusTree(added.id);
      const groupEl = currentController.node.querySelector(`[data-db-id="${added.id}"]`);
      if (groupEl) {
        prepareTreeForGrow(groupEl);
        animateTreeGrow(groupEl);
      }
    },
    onDelete: async (id, storedLandscapeId) => {
      await deleteLandscapeTree(id, landscape, storedLandscapeId);
      userTrees = userTrees.filter((tree) => tree.id !== id);
      updateTreeCounts();
      if (currentController) {
        currentController.setUserTrees(userTrees);
      }
    },
    onFocusTree: (id) => {
      focusTree(id);
    },
    onFocusRank: (rankIndex) => {
      focusRank(rankIndex);
    },
  }));
}

bootstrap();

window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  applyLandscape(params.get("landscape"), {seed: parseSeedFromUrl(params)}).catch((error) => {
    console.error("Failed to switch landscape:", error);
    const restore = new URLSearchParams(window.location.search);
    restore.set("landscape", landscape);
    restore.set("seed", String(currentSeed));
    const query = restore.toString();
    history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    syncLandscapeControl(landscape);
  });
});

if (showMode) {
  const contentDiv = document.querySelector(".content");
  const links = contentDiv.querySelectorAll("a");
  links.forEach((link) => {
    const text = link.textContent;
    link.replaceWith(document.createTextNode(text));
  });
}

function handleResize() {
  createAndRender();
}

document.addEventListener("fullscreenchange", handleResize);
document.addEventListener("webkitfullscreenchange", handleResize);
document.addEventListener("mozfullscreenchange", handleResize);
document.addEventListener("MSFullscreenChange", handleResize);
window.addEventListener("resize", handleResize);
