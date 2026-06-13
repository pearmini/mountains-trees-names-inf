import {rankIndexForDbId, render} from "./render.js";
import {initShowModeQr} from "./showModeQr.js";
import {initUI} from "./ui.js";
import {
  addLandscapeTree,
  deleteLandscapeTree,
  fetchLandscapeTreeCount,
  fetchLandscapeTrees,
} from "./lib/landscapeTreesApi.js";
import {inject} from "@vercel/analytics";

const urlParams = new URLSearchParams(window.location.search);
const showMode = urlParams.get("show") === "true";

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
let communityTreeCount = 0;
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

function focusTree(dbId) {
  focusRank(rankIndexForDbId(userTrees, dbId));
}

async function loadUserTrees() {
  try {
    const [trees, count] = await Promise.all([
      fetchLandscapeTrees(),
      fetchLandscapeTreeCount(),
    ]);
    userTrees = trees;
    communityTreeCount = count;
  } catch (error) {
    console.error("Failed to load community trees:", error);
    userTrees = [];
    communityTreeCount = 0;
  }
  return userTrees;
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
  });

  container.appendChild(currentController.node);

  if (panToOrigin) {
    requestAnimationFrame(() => currentController.panToCenter());
  }
}

async function refreshUserTrees() {
  await loadUserTrees();
  if (currentController) {
    currentController.setUserTrees(userTrees);
  }
  updateTreeCounts();
  return userTrees;
}

async function bootstrap() {
  await loadUserTrees();
  createAndRender();

  ({setInteractionBlocked, updateTreeCounts} = initUI({
    showMode,
    getUserTrees: () => userTrees,
    getCommunityTreeCount: () => communityTreeCount,
    refreshUserTrees,
    onRegenerateLandscape: regenerateLandscape,
    onAdd: async (name) => {
      const added = await addLandscapeTree(name);
      userTrees = [added, ...userTrees.filter((tree) => tree.id !== added.id)];
      communityTreeCount += 1;
      updateTreeCounts();
      focusTree(added.id);
    },
    onDelete: async (id) => {
      await deleteLandscapeTree(id);
      userTrees = userTrees.filter((tree) => tree.id !== id);
      communityTreeCount = Math.max(0, communityTreeCount - 1);
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
