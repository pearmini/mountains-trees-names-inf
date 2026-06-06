import {render} from "./render.js";
import {initUI} from "./ui.js";
import {
  addLandscapeTree,
  deleteLandscapeTree,
  fetchLandscapeTrees,
} from "./lib/landscapeTreesApi.js";

const urlParams = new URLSearchParams(window.location.search);
const showFullscreenButton = urlParams.get("show") === "true";

let currentController = null;
let userTrees = [];
let setInteractionBlocked = () => {};
let updateTreeCounts = () => {};
let currentSeed = process.env.NODE_ENV === "development" ? 10000 : Date.now();

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
    getUserTrees: () => userTrees,
    refreshUserTrees,
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

if (showFullscreenButton) {
  const contentDiv = document.querySelector(".content");
  const links = contentDiv.querySelectorAll("a");
  links.forEach((link) => {
    const text = link.textContent;
    link.replaceWith(document.createTextNode(text));
  });
}

if (showFullscreenButton) {
  const fullscreenButton = document.createElement("button");
  fullscreenButton.textContent = "⛶ Fullscreen";
  fullscreenButton.style.cssText = `
    position: fixed;
    top: 16px;
    right: 60px;
    z-index: 1000;
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: "IBM Plex Mono", monospace;
    transition: background 0.2s;
  `;
  fullscreenButton.addEventListener("mouseenter", () => {
    fullscreenButton.style.background = "rgba(0, 0, 0, 0.9)";
  });
  fullscreenButton.addEventListener("mouseleave", () => {
    fullscreenButton.style.background = "rgba(0, 0, 0, 0.7)";
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  });

  document.body.appendChild(fullscreenButton);

  function updateButtonVisibility() {
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    fullscreenButton.style.display = isFullscreen ? "none" : "block";
  }

  document.addEventListener("fullscreenchange", updateButtonVisibility);
  document.addEventListener("webkitfullscreenchange", updateButtonVisibility);
  document.addEventListener("mozfullscreenchange", updateButtonVisibility);
  document.addEventListener("MSFullscreenChange", updateButtonVisibility);
}

function handleResize() {
  createAndRender();
}

document.addEventListener("fullscreenchange", handleResize);
document.addEventListener("webkitfullscreenchange", handleResize);
document.addEventListener("mozfullscreenchange", handleResize);
document.addEventListener("MSFullscreenChange", handleResize);
window.addEventListener("resize", handleResize);
