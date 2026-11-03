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
const landscape = parseLandscape(urlParams.get("landscape"));
const includeArchive = landscapeIncludesArchive(landscape);

if (showMode) {
  document.body.classList.add("show-mode");
  initShowModeQr();
}

inject();

function parseSeedFromUrl() {
  const seedParam = urlParams.get("seed");
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
let uistTrees = [];
let publicTrees = null;
let forestView = "uist";
let setInteractionBlocked = () => {};
let updateTreeCounts = () => {};
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

function viewingPublicForest() {
  return showMode && forestView === "public";
}

function viewTrees() {
  if (viewingPublicForest()) return publicTrees ?? [];
  if (showMode) return uistTrees;
  return userTrees;
}

function viewArchive() {
  return viewingPublicForest() ? true : includeArchive;
}

function focusTree(dbId) {
  focusRank(rankIndexForDbId(viewTrees(), dbId, {includeArchive: viewArchive()}));
}

async function loadUserTrees() {
  try {
    if (showMode) {
      uistTrees = await fetchLandscapeTrees("uist");
      userTrees = uistTrees;
    } else {
      userTrees = await fetchLandscapeTrees(landscape);
    }
  } catch (error) {
    console.error("Failed to load community trees:", error);
    if (showMode) uistTrees = [];
    userTrees = [];
  }
  return userTrees;
}

async function showForest(view) {
  if (!showMode || view === forestView) return;
  if (view === "public" && !publicTrees) {
    publicTrees = await fetchLandscapeTrees("all");
  }
  forestView = view;
  centerRankIndex = 0;
  createAndRender({panToOrigin: true});
}

function createAndRender({panToOrigin = false} = {}) {
  const container = document.querySelector("#container");
  if (currentController?.node) {
    container.removeChild(currentController.node);
  }

  currentController = render({
    width: window.innerWidth,
    seed: currentSeed,
    userTrees: viewTrees(),
    centerRankIndex,
    includeArchive: viewArchive(),
    onceEach: showMode,
  });

  container.appendChild(currentController.node);

  if (panToOrigin) {
    requestAnimationFrame(() => currentController.panToCenter());
  }
}

async function refreshUserTrees() {
  await loadUserTrees();
  if (currentController && !viewingPublicForest()) {
    currentController.setUserTrees(viewTrees());
  }
  updateTreeCounts();
  return userTrees;
}

async function bootstrap() {
  await loadUserTrees();
  createAndRender();

  ({setInteractionBlocked, updateTreeCounts} = initUI({
    showMode,
    landscape,
    getUserTrees: () => userTrees,
    getCommunityTreeCount: () => userTrees.length,
    refreshUserTrees,
    onRegenerateLandscape: regenerateLandscape,
    onForestView: showForest,
    onAdd: async (name) => {
      if (showMode && forestView !== "uist") return;
      const target = showMode ? "uist" : landscape;
      const added = await addLandscapeTree(name, target);
      const next = [added, ...viewTrees().filter((tree) => tree.id !== added.id)];
      if (showMode) {
        uistTrees = next;
        userTrees = uistTrees;
      } else {
        userTrees = next;
      }
      updateTreeCounts();
      focusTree(added.id);
      const groupEl = currentController.node.querySelector(`[data-db-id="${added.id}"]`);
      if (groupEl) {
        prepareTreeForGrow(groupEl);
        animateTreeGrow(groupEl);
      }
    },
    onDelete: async (id) => {
      if (showMode && forestView !== "uist") return;
      const target = showMode ? "uist" : landscape;
      await deleteLandscapeTree(id, target);
      const next = viewTrees().filter((tree) => tree.id !== id);
      if (showMode) {
        uistTrees = next;
        userTrees = uistTrees;
      } else {
        userTrees = next;
      }
      updateTreeCounts();
      if (currentController) {
        currentController.setUserTrees(viewTrees());
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
