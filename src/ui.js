import {tree} from "./tree.js";
import namesData from "./names.json";
import {createHowItWorksPanel} from "./howItWorks.js";
import {getBrowserId} from "./lib/browserId.js";
import {isSupabaseConfigured} from "./lib/landscapeTreesApi.js";
import {downloadTreePng, downloadTreeSvg, renderTreePngBlob} from "./lib/treeImageExport.js";
import {uploadTreePng} from "./lib/treeImageUpload.js";
import {validateName} from "./lib/validateName.js";
import {createTreePrintQrModal} from "./treePrintQr.js";

const PREVIEW_OPTIONS = {
  grid: false,
  padding: 0,
  number: false,
  line: false,
  end: false,
  stampCellSize: 80,
};
const THUMB_OPTIONS = {
  grid: false,
  padding: 0,
  number: false,
  line: false,
  end: false,
  stampCellSize: 80,
};

function renderTreePreview(container, name, options = PREVIEW_OPTIONS) {
  container.innerHTML = "";
  const text = name.trim() || "Name To Tree";
  const width = options.width ?? 480;
  const height = options.height ?? width;
  const node = tree(text, {...options, width, height}).render();
  node.setAttribute("viewBox", `0 0 ${width} ${height}`);
  node.setAttribute("preserveAspectRatio", "xMidYMid meet");
  node.style.width = "100%";
  node.style.height = "100%";
  node.style.display = "block";
  container.appendChild(node);
}

function createModal({title, onClose, getHelpSample}) {
  let helpPanel = null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });

  const group = document.createElement("div");
  group.className = "modal-group";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.addEventListener("click", (event) => {
    event.stopPropagation();
    closeHelp();
  });

  const header = document.createElement("div");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.className = "modal-title";
  heading.textContent = title;

  const headerActions = document.createElement("div");
  headerActions.className = "modal-header-actions";

  const helpButton = document.createElement("button");
  helpButton.type = "button";
  helpButton.className = "modal-help";
  helpButton.setAttribute("aria-label", "How it works");
  helpButton.setAttribute("aria-pressed", "false");
  helpButton.textContent = "?";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "modal-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", onClose);

  headerActions.append(helpButton, closeButton);
  header.append(heading, headerActions);
  dialog.appendChild(header);
  group.appendChild(dialog);
  overlay.appendChild(group);

  function closeHelp() {
    if (!helpPanel) return;
    helpPanel.remove();
    helpPanel = null;
    group.classList.remove("modal-group-with-help");
    helpButton.setAttribute("aria-pressed", "false");
  }

  function openHelp() {
    if (helpPanel) return;
    helpPanel = createHowItWorksPanel({
      getSample: getHelpSample ?? (() => "AB"),
      onClose: closeHelp,
    });
    group.classList.add("modal-group-with-help");
    group.appendChild(helpPanel);
    helpButton.setAttribute("aria-pressed", "true");
  }

  helpButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (helpPanel) closeHelp();
    else openHelp();
  });

  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
  };
  document.addEventListener("keydown", onKeyDown);

  return {
    overlay,
    dialog,
    closeHelp,
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      closeHelp();
      overlay.remove();
    },
  };
}

function createTreeActionButton({className, label, icon, onClick}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `my-tree-action ${className}`;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createTreeFocusAction({onFocus}) {
  const actions = document.createElement("div");
  actions.className = "my-tree-actions";
  actions.append(
    createTreeActionButton({
      className: "my-tree-focus",
      label: "Focus on tree",
      icon:
        '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
      onClick: onFocus,
    }),
  );
  return actions;
}

function createTreeActions({onFocus, onDelete}) {
  const actions = document.createElement("div");
  actions.className = "my-tree-actions";
  actions.append(
    createTreeActionButton({
      className: "my-tree-focus",
      label: "Focus on tree",
      icon:
        '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
      onClick: onFocus,
    }),
    createTreeActionButton({
      className: "my-tree-delete",
      label: "Delete tree",
      icon:
        '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
      onClick: onDelete,
    }),
  );
  return actions;
}

export function initUI({
  showMode = false,
  onAdd,
  onDelete,
  onFocusTree,
  onFocusRank,
  onRegenerateLandscape,
  getUserTrees,
  getCommunityTreeCount,
  refreshUserTrees,
}) {
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const plantWrap = document.createElement("div");
  plantWrap.className = "toolbar-plant-wrap";

  const plantButton = document.createElement("button");
  plantButton.type = "button";
  plantButton.className = "toolbar-btn toolbar-btn-primary";
  plantButton.textContent = "+ Plant";

  if (showMode) {
    const plantHint = document.createElement("p");
    plantHint.className = "toolbar-show-hint";
    plantHint.textContent = "Tap to plant your name as a tree";
    plantWrap.append(plantHint, plantButton);
  } else {
    plantWrap.appendChild(plantButton);
  }

  const remixWrap = document.createElement("div");
  remixWrap.className = "toolbar-item-with-tooltip toolbar-remix-wrap";

  const remixButton = document.createElement("button");
  remixButton.type = "button";
  remixButton.className = "toolbar-btn toolbar-btn-secondary";
  remixButton.textContent = "Remix";

  const remixTooltip = document.createElement("div");
  remixTooltip.className = "toolbar-tooltip";
  remixTooltip.id = "remix-tooltip";
  remixTooltip.setAttribute("role", "tooltip");
  remixTooltip.textContent =
    "Generate a new random landscape. Mountains change; trees stay the same.";
  remixButton.setAttribute("aria-describedby", remixTooltip.id);

  if (showMode) {
    remixTooltip.classList.add("toolbar-show-hint");
    remixWrap.append(remixTooltip, remixButton);
  } else {
    remixWrap.append(remixButton, remixTooltip);
  }

  const myTreesButton = document.createElement("button");
  myTreesButton.type = "button";
  myTreesButton.className = "toolbar-btn toolbar-btn-secondary";
  myTreesButton.textContent = "My trees";

  let searchButton = null;
  if (import.meta.env.DEV) {
    searchButton = document.createElement("button");
    searchButton.type = "button";
    searchButton.className = "toolbar-btn toolbar-btn-secondary toolbar-btn-dev";
    searchButton.textContent = "Search";
  }

  toolbar.append(plantWrap, remixWrap, myTreesButton, ...(searchButton ? [searchButton] : []));
  document.body.appendChild(toolbar);

  const totalTreesEl = document.createElement("p");
  totalTreesEl.className = "tree-count";
  document.querySelector(".content")?.appendChild(totalTreesEl);

  function ownTreeCount() {
    const browserId = getBrowserId();
    return getUserTrees().filter((entry) => entry.browserId === browserId).length;
  }

  function myTreesLabel() {
    return `My trees (${ownTreeCount()})`;
  }

  function totalTreeCount() {
    return getCommunityTreeCount() + namesData.length;
  }

  function updateTreeCounts() {
    myTreesButton.textContent = myTreesLabel();
    totalTreesEl.textContent = `${totalTreeCount().toLocaleString()} trees in the landscape`;
  }

  let activeModal = null;
  let printQrModal = null;

  function closePrintQrModal() {
    if (printQrModal) {
      printQrModal.destroy();
      printQrModal = null;
    }
  }

  function closeModal() {
    closePrintQrModal();
    if (activeModal) {
      activeModal.destroy();
      activeModal = null;
    }
  }

  async function openTreePrintQr(name) {
    closePrintQrModal();

    const pngBlob = await renderTreePngBlob(name);
    const imageUrl = await uploadTreePng(pngBlob, name);

    printQrModal = createTreePrintQrModal({
      name,
      imageUrl,
      onClose: closePrintQrModal,
    });
    document.body.appendChild(printQrModal.overlay);
  }

  function openAddModal() {
    closeModal();
    if (!isSupabaseConfigured()) {
      openMessageModal("Not connected", "Planting is not available yet. Please try again later.");
      return;
    }

    const body = document.createElement("div");
    body.className = "modal-body";

    const preview = document.createElement("div");
    preview.className = "modal-preview";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "modal-input";
    input.placeholder = "Type your name or a short phrase…";
    input.maxLength = 80;
    input.autocomplete = "off";

    const modal = createModal({
      title: "Plant your tree",
      onClose: closeModal,
      getHelpSample: () => input.value,
    });
    modal.dialog.classList.add("modal-dialog-plant");
    if (showMode) {
      modal.dialog.classList.add("modal-dialog-plant-show");
    }
    activeModal = modal;

    const privacy = document.createElement("p");
    privacy.className = "modal-privacy";
    privacy.textContent =
      "Your name will appear publicly in the landscape. It is stored only for this project and not used for anything else. You can delete your trees anytime in My trees.";

    const error = document.createElement("p");
    error.className = "modal-error";
    error.hidden = true;

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "toolbar-btn toolbar-btn-primary";
    submit.textContent = "Plant your tree";

    let takeHomeButton = null;
    let downloadPngButton = null;
    let downloadSvgButton = null;

    if (showMode) {
      takeHomeButton = document.createElement("button");
      takeHomeButton.type = "button";
      takeHomeButton.className = "toolbar-btn toolbar-btn-secondary";
      takeHomeButton.textContent = "Take home";
    } else {
      downloadPngButton = document.createElement("button");
      downloadPngButton.type = "button";
      downloadPngButton.className = "toolbar-btn toolbar-btn-secondary";
      downloadPngButton.textContent = "Download PNG";

      downloadSvgButton = document.createElement("button");
      downloadSvgButton.type = "button";
      downloadSvgButton.className = "toolbar-btn toolbar-btn-secondary";
      downloadSvgButton.textContent = "Download SVG";
    }

    actions.append(
      ...(downloadPngButton && downloadSvgButton ? [downloadPngButton, downloadSvgButton] : []),
      submit,
      ...(takeHomeButton ? [takeHomeButton] : []),
    );
    body.append(preview, input, privacy, error, actions);
    modal.dialog.appendChild(body);
    document.body.appendChild(modal.overlay);

    renderTreePreview(preview, input.value);
    input.focus();

    input.addEventListener("input", () => {
      error.hidden = true;
      renderTreePreview(preview, input.value);
    });

    async function handleSubmit() {
      const validation = validateName(input.value);
      if (!validation.ok) {
        error.textContent = validation.error;
        error.hidden = false;
        return;
      }

      const name = validation.name;
      closeModal();

      try {
        await onAdd(name);
      } catch (err) {
        openMessageModal("Could not plant", err.message ?? "Please try again.");
      }
    }

    submit.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleSubmit();
    });

    async function handleDownload(button, download) {
      const validation = validateName(input.value);
      if (!validation.ok) {
        error.textContent = validation.error;
        error.hidden = false;
        return;
      }

      error.hidden = true;
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Preparing…";

      try {
        await download(validation.name);
      } catch (err) {
        openMessageModal("Could not download", err.message ?? "Please try again.");
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }

    if (downloadPngButton && downloadSvgButton) {
      downloadPngButton.addEventListener("click", () =>
        handleDownload(downloadPngButton, downloadTreePng),
      );
      downloadSvgButton.addEventListener("click", () => {
        const validation = validateName(input.value);
        if (!validation.ok) {
          error.textContent = validation.error;
          error.hidden = false;
          return;
        }

        error.hidden = true;
        try {
          downloadTreeSvg(validation.name);
        } catch (err) {
          openMessageModal("Could not download", err.message ?? "Please try again.");
        }
      });
    }

    if (takeHomeButton) {
      takeHomeButton.addEventListener("click", async () => {
        const validation = validateName(input.value);
        if (!validation.ok) {
          error.textContent = validation.error;
          error.hidden = false;
          return;
        }

        error.hidden = true;
        takeHomeButton.disabled = true;
        const originalLabel = takeHomeButton.textContent;
        takeHomeButton.textContent = "Preparing…";

        try {
          await openTreePrintQr(validation.name);
        } catch (err) {
          openMessageModal("Could not prepare print", err.message ?? "Please try again.");
        } finally {
          takeHomeButton.disabled = false;
          takeHomeButton.textContent = originalLabel;
        }
      });
    }
  }

  function openMessageModal(title, message) {
    closeModal();
    const modal = createModal({title, onClose: closeModal});
    activeModal = modal;

    const body = document.createElement("p");
    body.className = "modal-message";
    body.textContent = message;
    modal.dialog.appendChild(body);
    document.body.appendChild(modal.overlay);
  }

  function openMyTreesModal() {
    closeModal();
    if (!isSupabaseConfigured()) {
      openMessageModal("Not connected", "Your trees are not available yet. Please try again later.");
      return;
    }

    const modal = createModal({title: myTreesLabel(), onClose: closeModal});
    modal.dialog.classList.add("modal-dialog-my-trees");
    activeModal = modal;

    const body = document.createElement("div");
    body.className = "modal-body my-trees-body";
    modal.dialog.appendChild(body);
    document.body.appendChild(modal.overlay);

    const browserId = getBrowserId();
    const ownTrees = getUserTrees().filter((entry) => entry.browserId === browserId);

    if (ownTrees.length === 0) {
      const empty = document.createElement("p");
      empty.className = "modal-message";
      empty.textContent = "You haven't planted a tree here yet.";
      body.appendChild(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "my-trees-grid";

    for (const entry of ownTrees) {
      const cell = document.createElement("div");
      cell.className = "my-tree-cell";

      const thumb = document.createElement("div");
      thumb.className = "my-tree-thumb";
      renderTreePreview(thumb, entry.name, THUMB_OPTIONS);

      const label = document.createElement("p");
      label.className = "my-tree-label";
      label.textContent = entry.name;

      cell.append(
        thumb,
        label,
        createTreeActions({
          onFocus: () => {
            closeModal();
            void onFocusTree(entry.id);
          },
          onDelete: async () => {
            if (!confirm(`Remove "${entry.name}" from the landscape?`)) return;
            try {
              await onDelete(entry.id);
              await refreshUserTrees();
              closeModal();
              openMyTreesModal();
            } catch (err) {
              openMessageModal("Could not delete", err.message ?? "Please try again.");
            }
          },
        }),
      );
      grid.appendChild(cell);
    }

    body.appendChild(grid);
  }

  function buildSearchCatalog() {
    const communityCount = getUserTrees().length;
    const community = getUserTrees().map((entry) => ({
      key: `community-${entry.id}`,
      name: entry.name,
      source: "community",
      dbId: entry.id,
      createdAt: entry.createdAt,
    }));
    const archive = namesData.map((entry, index) => ({
      key: `archive-${index}`,
      name: entry.name,
      source: "archive",
      rankIndex: communityCount + index,
    }));
    return [...community, ...archive];
  }

  function formatSearchMeta(entry) {
    if (entry.source === "community" && entry.createdAt) {
      const date = new Date(entry.createdAt);
      if (!Number.isNaN(date.getTime())) {
        return `Planted ${date.toLocaleDateString()}`;
      }
    }
    return entry.source === "community" ? "Community" : "Archive";
  }

  function renderSearchResults(container, query) {
    container.innerHTML = "";
    const q = query.trim().toLowerCase();
    if (!q) {
      const hint = document.createElement("p");
      hint.className = "modal-message search-hint";
      hint.textContent = "Type a name to search community and archive trees.";
      container.appendChild(hint);
      return;
    }

    const matches = buildSearchCatalog()
      .filter((entry) => entry.name.toLowerCase().includes(q))
      .slice(0, 40);

    if (matches.length === 0) {
      const empty = document.createElement("p");
      empty.className = "modal-message";
      empty.textContent = `No trees match “${query.trim()}”.`;
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "my-trees-grid search-trees-grid";

    for (const entry of matches) {
      const cell = document.createElement("div");
      cell.className = "my-tree-cell";

      const thumb = document.createElement("div");
      thumb.className = "my-tree-thumb";
      renderTreePreview(thumb, entry.name, THUMB_OPTIONS);

      const label = document.createElement("p");
      label.className = "my-tree-label";
      label.textContent = entry.name;

      const meta = document.createElement("p");
      meta.className = "search-tree-meta";
      meta.textContent = formatSearchMeta(entry);

      cell.append(
        thumb,
        label,
        meta,
        createTreeFocusAction({
          onFocus: () => {
            closeModal();
            if (entry.dbId) {
              void onFocusTree(entry.dbId);
            } else {
              void onFocusRank?.(entry.rankIndex);
            }
          },
        }),
      );
      grid.appendChild(cell);
    }

    container.appendChild(grid);
  }

  function openSearchModal() {
    closeModal();

    const modal = createModal({title: "Search trees (dev)", onClose: closeModal});
    modal.dialog.classList.add("modal-dialog-search");
    activeModal = modal;

    const body = document.createElement("div");
    body.className = "modal-body search-trees-body";

    const input = document.createElement("input");
    input.type = "search";
    input.className = "modal-input search-trees-input";
    input.placeholder = "Search by name…";
    input.autocomplete = "off";

    const results = document.createElement("div");
    results.className = "search-trees-results";

    body.append(input, results);
    modal.dialog.appendChild(body);
    document.body.appendChild(modal.overlay);

    renderSearchResults(results, input.value);
    input.focus();

    input.addEventListener("input", () => {
      renderSearchResults(results, input.value);
    });
  }

  plantButton.addEventListener("click", openAddModal);
  remixButton.addEventListener("click", () => onRegenerateLandscape?.());
  myTreesButton.addEventListener("click", openMyTreesModal);
  searchButton?.addEventListener("click", openSearchModal);
  updateTreeCounts();

  function setInteractionBlocked(blocked) {
    document.body.classList.toggle("interaction-blocked", blocked);
    plantButton.disabled = blocked;
    remixButton.disabled = blocked;
    myTreesButton.disabled = blocked;
    if (searchButton) searchButton.disabled = blocked;
  }

  return {closeModal, setInteractionBlocked, updateTreeCounts};
}
