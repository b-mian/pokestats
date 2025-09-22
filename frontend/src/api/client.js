// src/api/client.js
const API_BASE =
  process.env.REACT_APP_POKESTATS_API ||
  (window?.location?.origin?.startsWith("http") ? window.location.origin : "http://127.0.0.1:8000");

// DEBUG: log once so we know which base the app is using:
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[client] API_BASE =", API_BASE);
}

async function get(url) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${url}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchPokemon({ q, type, sort, order = "asc", limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);
  params.set("limit", limit);
  params.set("offset", offset);
  return get(`${API_BASE}/pokemon?${params.toString()}`);
}

export async function fetchPokemonCount({ q, type } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  return get(`${API_BASE}/pokemon/count?${params.toString()}`);
}

export async function fetchTop10(category) {
  return get(`${API_BASE}/stats/top10/${category}`);
}

export async function fetchGenAverages(gen) {
  return get(`${API_BASE}/stats/gen/${gen}`);
}

export async function fetchTypeFrequencies(slot, format) {
  const qs = new URLSearchParams();
  if (slot) qs.set("slot", String(slot));
  if (format) qs.set("format", format);
  return get(`${API_BASE}/stats/types?${qs.toString()}`);
}