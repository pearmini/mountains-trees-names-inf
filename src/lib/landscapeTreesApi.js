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

export async function fetchLandscapeTrees() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const {data, error} = await supabase
    .from("landscape_trees")
    .select("id, name, browser_id, created_at")
    .order("created_at", {ascending: false});

  if (error) throw error;
  return (data ?? []).map(rowToTree);
}

export async function fetchLandscapeTreeCount() {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const {count, error} = await supabase
    .from("landscape_trees")
    .select("*", {count: "exact", head: true});

  if (error) throw error;
  return count ?? 0;
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
