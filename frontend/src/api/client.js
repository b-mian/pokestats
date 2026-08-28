// src/api/client.js
const API_ORIGIN =
  import.meta.env.REACT_APP_POKESTATS_API ||
  (window?.location?.origin?.startsWith("http") ? window.location.origin : "http://127.0.0.1:8000");
// All backend endpoints live under /api so they can never collide with
// client-side routes like /quiz or /pokemon/6.
const API_BASE = `${API_ORIGIN.replace(/\/$/, "")}/api`;

async function get(url) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${url}: ${text || res.statusText}`);
  }
  return res.json();
}

function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchPokemon(params = {}) {
  return get(`${API_BASE}/pokemon${qs(params)}`);
}

export async function fetchPokemonCount({ q, type, generation, legendary, include_forms, bst_min, bst_max } = {}) {
  return get(`${API_BASE}/pokemon/count${qs({ q, type, generation, legendary, include_forms, bst_min, bst_max })}`);
}

export async function fetchPokemonById(id) {
  return get(`${API_BASE}/pokemon/${id}`);
}

export async function fetchPokemonDetail(id) {
  return get(`${API_BASE}/pokemon/${id}/detail`);
}

export async function fetchRandomPokemon(params = {}) {
  return get(`${API_BASE}/pokemon/random${qs(params)}`);
}

export async function fetchPokemonOfTheDay() {
  return get(`${API_BASE}/pokemon/potd`);
}

export async function fetchTop10(category) {
  return get(`${API_BASE}/stats/top10/${category}`);
}

export async function fetchGenAverages(gen) {
  return get(`${API_BASE}/stats/gen/${gen}`);
}

export async function fetchTypeFrequencies(slot) {
  return get(`${API_BASE}/stats/types${qs({ slot })}`);
}

export async function fetchTypeChart() {
  return get(`${API_BASE}/stats/typechart`);
}

export async function fetchQuiz({ count = 10, difficulty = "medium" } = {}) {
  return get(`${API_BASE}/quiz${qs({ count, difficulty })}`);
}
