const API_BASE = process.env.REACT_APP_POKESTATS_API || "http://localhost:8000";

export async function fetchPokemon({ q, type, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  params.set("limit", limit);
  params.set("offset", offset);
  const res = await fetch(`${API_BASE}/pokemon?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch pokemon");
  return await res.json();
}

export async function fetchTop10(category) {
  const res = await fetch(`${API_BASE}/stats/top10/${category}`);
  if (!res.ok) throw new Error("Failed to fetch top10");
  return await res.json();
}

export async function fetchGenAverages(gen) {
  const res = await fetch(`${API_BASE}/stats/gen/${gen}`);
  if (!res.ok) throw new Error("Failed to fetch gen averages");
  return await res.json();
}

export async function fetchTypeFrequencies(slot) {
  const url = slot ? `${API_BASE}/stats/types?slot=${slot}` : `${API_BASE}/stats/types`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch type frequencies");
  return await res.json();
}
