// Prefer local sprites if you have them; else fall back to PokeAPI CDN.
const LOCAL_BASE = process.env.REACT_APP_SPRITES_BASE || ""; // e.g. "/sprites"
const CDN_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function spriteUrl(id) {
  // If you later add local files (public/sprites/1.png ...), set REACT_APP_SPRITES_BASE="/sprites"
  if (LOCAL_BASE) return `${LOCAL_BASE}/${id}.png`;
  return `${CDN_BASE}/${id}.png`;
}