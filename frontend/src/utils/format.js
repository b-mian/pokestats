// Shared formatting helpers + canonical type colors.

export function prettyName(name) {
  if (!name) return "";
  return String(name)
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Community-standard type palette; used everywhere a type appears.
export const TYPE_COLORS = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

export function typeColor(type) {
  return TYPE_COLORS[type] || "#0f8b8d";
}

export const STAT_KEYS = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"];

export const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  sp_attack: "Sp. Atk",
  sp_defense: "Sp. Def",
  speed: "Speed",
  bst: "BST",
  height_m: "Height",
  weight_kg: "Weight",
  base_experience: "Base XP",
};
