const MODES = new Set(["all", "community", "itp25", "uist26"]);
const ALIASES = {itp: "itp25", uist: "uist26"};

export function parseLandscape(value) {
  const key = String(value ?? "").trim().toLowerCase();
  const mode = ALIASES[key] ?? key;
  return MODES.has(mode) ? mode : "all";
}

export function landscapeIncludesArchive(landscape) {
  return landscape === "all" || landscape === "itp25";
}

/** Row key in landscape_trees. The ITP archive is names.json, not this table. */
export function storageLandscapeId(landscape) {
  if (landscape === "uist26") return "uist";
  if (landscape === "all" || landscape === "community") return "main";
  return null;
}

export function canPlant(landscape) {
  return landscape === "all" || landscape === "community";
}
