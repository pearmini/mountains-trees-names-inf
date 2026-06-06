import {tree} from "./tree.js";

const EXAMPLE = "AB";
const EDGE_CASE_EXAMPLE = "ego";
const EDGE_CASE_CODE = "101103111";

const TREE_PREVIEW_OPTIONS = {
  grid: false,
  padding: 0,
  line: false,
  end: false,
  width: 480,
  height: 480,
};

function renderTreeIn(container, name, options = {}) {
  const preview = document.createElement("div");
  preview.className = "help-tree-preview";
  const width = options.width ?? TREE_PREVIEW_OPTIONS.width;
  const height = options.height ?? width;
  const node = tree(name, {...TREE_PREVIEW_OPTIONS, ...options, width, height}).render();
  node.setAttribute("viewBox", `0 0 ${width} ${height}`);
  node.setAttribute("preserveAspectRatio", "xMidYMid meet");
  node.style.width = "100%";
  node.style.height = "100%";
  node.style.display = "block";
  preview.appendChild(node);
  container.appendChild(preview);
}

function renderHelpVisual(container, {code, renderContent}) {
  container.innerHTML = "";

  const codeEl = document.createElement("p");
  codeEl.className = "help-code-block";
  codeEl.textContent = code ?? "";
  if (!code) codeEl.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "help-visual-content";
  renderContent(content);

  container.append(codeEl, content);
}

function asciiLines(sample) {
  const text = sample.trim() || EXAMPLE;
  const chars = [...text];
  const codes = chars.map((char) => char.charCodeAt(0));
  return {text, chars, codes, joined: codes.join("")};
}

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Convert the input string into ASCII codes.",
    titleHtml:
      'Convert the input string into <a href="https://en.wikipedia.org/wiki/ASCII" target="_blank" rel="noopener noreferrer">ASCII codes</a>.',
    render(container, sample = EXAMPLE) {
      renderHelpVisual(container, {
        renderContent(content) {
          const {text, chars, codes, joined} = asciiLines(sample);
          const lines = chars
            .map((char, index) => {
              const code = codes[index];
              return `<p><span class="help-char">${char}</span><span class="help-arrow">→</span><span class="help-code">${code}</span></p>`;
            })
            .join("");
          content.innerHTML = `<div class="help-ascii">${lines}<p class="help-ascii-result"><span class="help-char">${text}</span><span class="help-arrow">→</span><span class="help-code">${joined}</span></p></div>`;
        },
      });
    },
  },
  {
    title: "Draw a tree based on the ASCII codes.",
    render(container, sample = EXAMPLE) {
      renderHelpVisual(container, {
        renderContent(content) {
          renderTreeIn(content, sample.trim() || EXAMPLE, {
            count: true,
            stamp: false,
            number: true,
            line: true,
          });
        },
      });
    },
  },
  {
    title: "Merge branches into mathematical rose.",
    titleHtml:
      'Merge branches into <a href="https://en.wikipedia.org/wiki/Rose_(mathematics)" target="_blank" rel="noopener noreferrer">mathematical rose</a>.',
    render(container, sample = EXAMPLE) {
      const {joined} = asciiLines(sample);
      renderHelpVisual(container, {
        code: joined,
        renderContent(content) {
          renderTreeIn(content, sample.trim() || EXAMPLE, {number: false, stamp: false});
        },
      });
    },
  },
  {
    title: "Optimize edge cases.",
    render(container) {
      renderHelpVisual(container, {
        code: EDGE_CASE_CODE,
        renderContent(content) {
          renderTreeIn(content, EDGE_CASE_EXAMPLE, {number: false, stamp: false});
        },
      });
    },
  },
  {
    title: "Render the signature using APack.",
    titleHtml:
      'Render the signature using <a href="https://apack.bairui.dev/" target="_blank" rel="noopener noreferrer">APack</a>.',
    render(container, sample = EXAMPLE) {
      const {joined} = asciiLines(sample);
      renderHelpVisual(container, {
        code: joined,
        renderContent(content) {
          renderTreeIn(content, sample.trim() || EXAMPLE, {number: false, stamp: true});
        },
      });
    },
  },
];

export function createHowItWorksPanel({getSample = () => EXAMPLE, onClose}) {
  let stepIndex = 0;

  const panel = document.createElement("div");
  panel.className = "modal-dialog modal-help-dialog";
  panel.addEventListener("click", (event) => event.stopPropagation());

  const header = document.createElement("div");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.className = "modal-title";
  heading.textContent = "How it works";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "modal-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", onClose);

  header.append(heading, closeButton);

  const body = document.createElement("div");
  body.className = "modal-body help-body";

  const stepTitle = document.createElement("p");
  stepTitle.className = "help-step-title";

  const visual = document.createElement("div");
  visual.className = "help-visual";

  const nav = document.createElement("div");
  nav.className = "help-nav";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "help-nav-btn";
  prevButton.setAttribute("aria-label", "Previous step");
  prevButton.textContent = "←";

  const dots = document.createElement("div");
  dots.className = "help-dots";
  dots.setAttribute("role", "tablist");

  const dotButtons = HOW_IT_WORKS_STEPS.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "help-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Step ${index + 1}`);
    dot.addEventListener("click", () => {
      stepIndex = index;
      renderStep();
    });
    dots.appendChild(dot);
    return dot;
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "help-nav-btn";
  nextButton.setAttribute("aria-label", "Next step");
  nextButton.textContent = "→";

  function renderStep() {
    const step = HOW_IT_WORKS_STEPS[stepIndex];
    stepTitle.innerHTML = `${stepIndex + 1}. ${step.titleHtml ?? step.title}`;
    visual.innerHTML = "";
    step.render(visual, getSample());

    dotButtons.forEach((dot, index) => {
      const active = index === stepIndex;
      dot.classList.toggle("help-dot-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });

    prevButton.disabled = stepIndex === 0;
    nextButton.disabled = stepIndex === HOW_IT_WORKS_STEPS.length - 1;
  }

  prevButton.addEventListener("click", () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderStep();
    }
  });

  nextButton.addEventListener("click", () => {
    if (stepIndex < HOW_IT_WORKS_STEPS.length - 1) {
      stepIndex += 1;
      renderStep();
    }
  });

  nav.append(prevButton, dots, nextButton);
  body.append(stepTitle, visual, nav);
  panel.append(header, body);
  renderStep();

  return panel;
}
