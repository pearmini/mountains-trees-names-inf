const MODES = new Set(["all", "community", "itp", "uist"]);

export function parseLandscape(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return MODES.has(key) ? key : "all";
}

export function landscapeIncludesArchive(landscape) {
  return landscape === "all" || landscape === "itp";
}

/** Row key in landscape_trees. The ITP archive is names.json, not this table. */
export function storageLandscapeId(landscape) {
  if (landscape === "uist") return "uist";
  if (landscape === "all" || landscape === "community") return "main";
  return null;
}

export function canPlant(landscape) {
  return storageLandscapeId(landscape) != null;
}
