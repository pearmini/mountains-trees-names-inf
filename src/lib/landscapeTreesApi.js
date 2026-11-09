import {getBrowserId} from "./browserId.js";
import {storageLandscapeId} from "./landscapeMode.js";
import {getSupabase, isSupabaseConfigured} from "./supabase.js";

function rowToTree(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    browserId: row.browser_id,
    source: "community",
    landscapeId: row.landscape_id,
  };
}

const PAGE_SIZE = 1000;
const TREE_COLUMNS = "id, name, browser_id, created_at, landscape_id";

async function fetchStoredTrees(supabase, landscapeId) {
  const trees = [];
  let from = 0;

  while (true) {
    const {data, error} = await supabase
      .from("landscape_trees")
      .select(TREE_COLUMNS)
      .eq("landscape_id", landscapeId)
      .order("created_at", {ascending: false})
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = data ?? [];
    trees.push(...page.map(rowToTree));
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return trees;
}

export async function fetchLandscapeTrees(landscape) {
  const landscapeIds = landscape === "all" ? ["main", "uist"] : [storageLandscapeId(landscape)];
  if (!landscapeIds[0]) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const lists = await Promise.all(landscapeIds.map((id) => fetchStoredTrees(supabase, id)));
  return lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addLandscapeTree(name, landscape) {
  const landscapeId = storageLandscapeId(landscape);
  if (!landscapeId) {
    throw new Error("This landscape does not accept new trees.");
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Landscape is not connected yet. Please try again later.");
  }

  const {data, error} = await supabase
    .from("landscape_trees")
    .insert({name: name.trim(), browser_id: getBrowserId(), landscape_id: landscapeId})
    .select(TREE_COLUMNS)
    .single();

  if (error) throw error;
  return rowToTree(data);
}

export async function deleteLandscapeTree(id, landscape, storedLandscapeId) {
  const landscapeId = storedLandscapeId || storageLandscapeId(landscape);
  if (!landscapeId) {
    throw new Error("This landscape does not store planted trees.");
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Landscape is not connected yet. Please try again later.");
  }

  const {error} = await supabase
    .from("landscape_trees")
    .delete()
    .eq("id", id)
    .eq("landscape_id", landscapeId);
  if (error) throw error;
}

export {isSupabaseConfigured};
