// Prefer local sprites if you have them; else fall back to PokeAPI CDN.
const LOCAL_BASE = import.meta.env.REACT_APP_SPRITES_BASE || ""; // e.g. "/sprites"
const CDN_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function spriteUrl(id) {
  if (LOCAL_BASE) return `${LOCAL_BASE}/${id}.png`;
  return `${CDN_BASE}/${id}.png`;
}

// Larger, painted artwork — for detail pages and quiz silhouettes.
export function artworkUrl(id) {
  return `${CDN_BASE}/other/official-artwork/${id}.png`;
}
