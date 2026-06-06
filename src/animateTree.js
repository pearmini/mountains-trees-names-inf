import * as d3 from "d3";

const BRANCH_DURATION = 380;
const FLOWER_DURATION = 320;
const NAME_DURATION = 320;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function prepareTreeForGrow(groupEl) {
  const svg = groupEl.querySelector("svg");
  if (!svg) return;

  svg.querySelectorAll('path[data-tree-part="branch"]').forEach((path) => {
    const len = path.getTotalLength?.() ?? 0;
    if (len > 0) {
      path.setAttribute("stroke-dasharray", `0 ${len}`);
      path.setAttribute("fill", "none");
    }
  });

  svg.querySelectorAll('path[data-tree-part="flower"]').forEach((path) => {
    path.setAttribute("opacity", "0");
  });

  svg.querySelectorAll('g[data-tree-part="flower"]').forEach((group) => {
    group.setAttribute("opacity", "0");
  });

  const nameGroup = svg.querySelector('[data-tree-part="name"]');
  if (nameGroup) {
    nameGroup.setAttribute("opacity", "0");
    nameGroup.querySelectorAll("path, text, rect, line, circle").forEach((el) => {
      el.setAttribute("opacity", "0");
    });
  }
}

function animateBranchPaths(paths) {
  if (paths.length === 0) return Promise.resolve(0);

  const sorted = [...paths].sort(
    (a, b) => Number(a.dataset.depth ?? 0) - Number(b.dataset.depth ?? 0),
  );
  const maxDepth = Math.max(...sorted.map((path) => Number(path.dataset.depth ?? 1)));

  const selection = d3.selectAll(sorted);
  selection.each(function () {
    const len = this.getTotalLength?.() ?? 0;
    if (len > 0) {
      d3.select(this).attr("stroke-dasharray", `0 ${len}`).attr("fill", "none");
    }
  });

  return new Promise((resolve) => {
    selection
      .transition()
      .delay((d, i, nodes) => {
        const depth = Number(nodes[i].dataset.depth ?? 1);
        return (depth - 1) * BRANCH_DURATION;
      })
      .duration(BRANCH_DURATION)
      .attr("stroke-dasharray", function () {
        const len = this.getTotalLength?.() ?? 0;
        return `${len} 0`;
      })
      .attrTween("stroke-linecap", () => (t) => (t === 1 ? "round" : ""));

    const totalMs = maxDepth * BRANCH_DURATION + 80;
    setTimeout(resolve, totalMs);
  });
}

function fadeInElements(elements, duration, stagger = 50) {
  if (elements.length === 0) return Promise.resolve(0);

  const selection = d3.selectAll(elements);
  selection.attr("opacity", 0);

  elements.forEach((el) => {
    const parent = el.closest('g[data-tree-part="flower"]');
    if (parent) d3.select(parent).attr("opacity", 1);
  });

  return new Promise((resolve) => {
    selection
      .transition()
      .delay((_, i) => i * stagger)
      .duration(duration)
      .attr("opacity", 1);

    const totalMs = (elements.length - 1) * stagger + duration + 40;
    setTimeout(resolve, totalMs);
  });
}

export async function animateTreeGrow(groupEl) {
  const svg = groupEl.querySelector("svg");
  if (!svg) return;

  const branchPaths = [...svg.querySelectorAll('path[data-tree-part="branch"]')];
  const flowerPaths = [...svg.querySelectorAll('path[data-tree-part="flower"]')];
  const nameGroup = svg.querySelector('[data-tree-part="name"]');
  const nameElements = nameGroup
    ? [...nameGroup.querySelectorAll("path, text, rect, line, circle")]
    : [];

  const flowerGroups = [...svg.querySelectorAll('g[data-tree-part="flower"]')];

  const branchMs = await animateBranchPaths(branchPaths);
  await wait(Math.max(0, branchMs * 0.1));

  flowerGroups.forEach((group) => group.setAttribute("opacity", "1"));
  const flowerMs = await fadeInElements(flowerPaths, FLOWER_DURATION, 60);
  await wait(Math.max(0, flowerMs * 0.1));

  if (nameGroup) nameGroup.setAttribute("opacity", "1");
  await fadeInElements(nameElements, NAME_DURATION, 40);
}
