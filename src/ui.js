import {tree} from "./tree.js";
import {getBrowserId} from "./lib/browserId.js";
import {isSupabaseConfigured} from "./lib/landscapeTreesApi.js";
import {validateName} from "./lib/validateName.js";

const PREVIEW_OPTIONS = {grid: false, padding: 0, number: false, line: false, end: false};
const THUMB_OPTIONS = {grid: false, padding: 0, number: false, line: false, end: false, width: 200};

function renderTreePreview(container, name, options = PREVIEW_OPTIONS) {
  container.innerHTML = "";
  const text = name.trim() || "Name To Tree";
  const node = tree(text, options).render();
  node.setAttribute("viewBox", "0 0 480 480");
  node.style.width = "100%";
  node.style.height = "100%";
  container.appendChild(node);
}

function createModal({title, onClose}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.addEventListener("click", (event) => event.stopPropagation());

  const header = document.createElement("div");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.className = "modal-title";
  heading.textContent = title;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "modal-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", onClose);

  header.append(heading, closeButton);
  dialog.appendChild(header);
  overlay.appendChild(dialog);

  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
  };
  document.addEventListener("keydown", onKeyDown);

  return {
    overlay,
    dialog,
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
    },
  };
}

function createDeleteButton(onDelete) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "my-tree-delete";
  button.setAttribute("aria-label", "Delete tree");

  const dot = document.createElement("span");
  dot.className = "my-tree-dot";
  dot.textContent = "*";

  const trash = document.createElement("span");
  trash.className = "my-tree-trash";
  trash.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

  button.append(dot, trash);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onDelete();
  });
  return button;
}

export function initUI({onAdd, onDelete, getUserTrees, refreshUserTrees}) {
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const plantButton = document.createElement("button");
  plantButton.type = "button";
  plantButton.className = "toolbar-btn toolbar-btn-primary";
  plantButton.textContent = "+ Plant";

  const myTreesButton = document.createElement("button");
  myTreesButton.type = "button";
  myTreesButton.className = "toolbar-btn toolbar-btn-secondary";
  myTreesButton.textContent = "My trees";

  toolbar.append(plantButton, myTreesButton);
  document.body.appendChild(toolbar);

  let activeModal = null;

  function closeModal() {
    if (activeModal) {
      activeModal.destroy();
      activeModal = null;
    }
  }

  function openAddModal() {
    closeModal();
    if (!isSupabaseConfigured()) {
      openMessageModal("Not connected", "Planting is not available yet. Please try again later.");
      return;
    }

    const modal = createModal({title: "Plant your tree", onClose: closeModal});
    activeModal = modal;

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

    const error = document.createElement("p");
    error.className = "modal-error";
    error.hidden = true;

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "toolbar-btn toolbar-btn-primary";
    submit.textContent = "Plant your tree";

    actions.appendChild(submit);
    body.append(preview, input, error, actions);
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

      submit.disabled = true;
      submit.textContent = "Planting…";
      error.hidden = true;

      try {
        await onAdd(validation.name);
        closeModal();
      } catch (err) {
        error.textContent = err.message ?? "Could not plant your tree. Please try again.";
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = "Plant your tree";
      }
    }

    submit.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleSubmit();
    });
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

    const modal = createModal({title: "My trees", onClose: closeModal});
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
        createDeleteButton(async () => {
          if (!confirm(`Remove "${entry.name}" from the landscape?`)) return;
          try {
            await onDelete(entry.id);
            await refreshUserTrees();
            closeModal();
            openMyTreesModal();
          } catch (err) {
            openMessageModal("Could not delete", err.message ?? "Please try again.");
          }
        }),
      );
      grid.appendChild(cell);
    }

    body.appendChild(grid);
  }

  plantButton.addEventListener("click", openAddModal);
  myTreesButton.addEventListener("click", openMyTreesModal);

  return {closeModal};
}
