import {getBrowserId} from "./browserId.js";
import {getSupabase, isSupabaseConfigured} from "./supabase.js";

function rowToTree(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    browserId: row.browser_id,
    source: "community",
  };
}

const PAGE_SIZE = 1000;

export async function fetchLandscapeTrees() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const trees = [];
  let from = 0;

  while (true) {
    const {data, error} = await supabase
      .from("landscape_trees")
      .select("id, name, browser_id, created_at")
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

export async function addLandscapeTree(name) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Landscape is not connected yet. Please try again later.");
  }

  const {data, error} = await supabase
    .from("landscape_trees")
    .insert({name: name.trim(), browser_id: getBrowserId()})
    .select("id, name, browser_id, created_at")
    .single();

  if (error) throw error;
  return rowToTree(data);
}

export async function deleteLandscapeTree(id) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Landscape is not connected yet. Please try again later.");
  }

  const {error} = await supabase.from("landscape_trees").delete().eq("id", id);
  if (error) throw error;
}

export {isSupabaseConfigured};
