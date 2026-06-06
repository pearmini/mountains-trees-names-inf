import {render} from "./render.js";
import {initUI} from "./ui.js";
import {
  addLandscapeTree,
  deleteLandscapeTree,
  fetchLandscapeTrees,
} from "./lib/landscapeTreesApi.js";
import {inject} from "@vercel/analytics";

const urlParams = new URLSearchParams(window.location.search);
const showMode = urlParams.get("show") === "true";

if (showMode) {
  document.body.classList.add("show-mode");
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
let setInteractionBlocked = () => {};
let updateTreeCounts = () => {};
let currentSeed = parseSeedFromUrl();
if (currentSeed == null) {
  currentSeed = Date.now() >>> 0;
  syncSeedToUrl(currentSeed);
}

function regenerateLandscape() {
  currentSeed = Date.now() >>> 0;
  syncSeedToUrl(currentSeed);
  createAndRender({panToOrigin: true});
}

async function loadUserTrees() {
  try {
    userTrees = await fetchLandscapeTrees();
  } catch (error) {
    console.error("Failed to load community trees:", error);
    userTrees = [];
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
    refreshUserTrees,
    onRegenerateLandscape: regenerateLandscape,
    onAdd: async (name) => {
      const added = await addLandscapeTree(name);
      userTrees = [added, ...userTrees.filter((tree) => tree.id !== added.id)];
      updateTreeCounts();
      if (currentController) {
        setInteractionBlocked(true);
        void currentController.setUserTreesAndGrow(userTrees, added.id).finally(() => {
          setInteractionBlocked(false);
        });
      }
    },
    onDelete: async (id) => {
      await deleteLandscapeTree(id);
      userTrees = userTrees.filter((tree) => tree.id !== id);
      updateTreeCounts();
      if (currentController) {
        currentController.setUserTrees(userTrees);
      }
    },
    onFocusTree: async (id) => {
      if (!currentController) return;
      setInteractionBlocked(true);
      try {
        await currentController.panToTreeAnimated(id);
      } finally {
        setInteractionBlocked(false);
      }
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
