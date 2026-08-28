import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePokemon, useTypeFrequencies } from "../api/hooks";
import { fetchPokemon, fetchRandomPokemon } from "../api/client";
import { getFavorites } from "../utils/favorites";
import PokedexCard from "./PokedexCard";
import ScrollButton from "./ScrollButton";
import "./styles/pokedex.css";

const PAGE_SIZE = 6;
const FAV_FETCH_LIMIT = 2000; // server max; favorites are filtered client-side

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const SORT_OPTIONS = [
  { value: "id", label: "Number" },
  { value: "name", label: "Name" },
  { value: "hp", label: "HP" },
  { value: "attack", label: "Attack" },
  { value: "defense", label: "Defense" },
  { value: "sp_attack", label: "Sp. Atk" },
  { value: "sp_defense", label: "Sp. Def" },
  { value: "speed", label: "Speed" },
  { value: "bst", label: "BST" },
  { value: "height_m", label: "Height" },
  { value: "weight_kg", label: "Weight" },
  { value: "base_experience", label: "Base XP" },
];

export default function PokedexGrid() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [generation, setGeneration] = useState("");
  const [rarity, setRarity] = useState("");          // "" | "legendary" | "regular"
  const [includeForms, setIncludeForms] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);

  // Bumped whenever a card's star is toggled so favorites mode stays live.
  const [favTick, setFavTick] = useState(0);
  const onFavoriteChange = useCallback(() => setFavTick(t => t + 1), []);

  // Shared filter/sort params — identical for both the server-paged path and
  // the favorites path, so only the pagination strategy differs.
  const filters = useMemo(() => ({
    q: q.trim() || undefined,
    type: type || undefined,
    generation: generation ? Number(generation) : undefined,
    legendary: rarity === "" ? undefined : rarity === "legendary",
    include_forms: includeForms ? true : undefined,
    sort,
    order,
  }), [q, type, generation, rarity, includeForms, sort, order]);

  // In favorites mode the server hook is idle-but-mounted (hooks can't be
  // conditional), so pin its offset to avoid refetching on client-side paging.
  const serverParams = useMemo(() => ({
    ...filters,
    limit: PAGE_SIZE,
    offset: (favoritesOnly ? 0 : page) * PAGE_SIZE,
  }), [filters, page, favoritesOnly]);

  const server = usePokemon(serverParams);

  // Favorites mode: one wide fetch, filtered + paginated in the browser.
  const [favRows, setFavRows] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favErr, setFavErr] = useState(null);

  useEffect(() => {
    if (!favoritesOnly) return undefined;
    let cancel = false;
    setFavLoading(true);
    fetchPokemon({ ...filters, limit: FAV_FETCH_LIMIT, offset: 0 })
      .then(rows => { if (!cancel) { setFavRows(Array.isArray(rows) ? rows : []); setFavErr(null); } })
      .catch(e => { if (!cancel) setFavErr(e); })
      .finally(() => { if (!cancel) setFavLoading(false); });
    return () => { cancel = true; };
  }, [favoritesOnly, filters]);

  // Server already applied sort/order, so preserve its row order here.
  const favFiltered = useMemo(() => {
    if (!favoritesOnly) return [];
    const ids = new Set(getFavorites());
    return favRows.filter(r => ids.has(r.id));
  }, [favoritesOnly, favRows, favTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = favoritesOnly
    ? favFiltered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : server.data;
  const total = favoritesOnly ? favFiltered.length : (server.count || 0);
  const loading = favoritesOnly ? favLoading : server.loading;
  const err = favoritesOnly ? favErr : server.err;

  const slot1 = useTypeFrequencies(1);
  const slot2 = useTypeFrequencies(2);
  const types = useMemo(() => {
    const set = new Set();
    [...slot1, ...slot2].forEach(r => r?.type && set.add(r.type));
    return Array.from(set).sort();
  }, [slot1, slot2]);

  // Any filter/sort change restarts pagination.
  useEffect(() => {
    setPage(0);
  }, [q, type, generation, rarity, includeForms, favoritesOnly, sort, order]);

  // Un-favoriting can shrink the list out from under the current page.
  useEffect(() => {
    if (page > 0 && page * PAGE_SIZE >= total) setPage(0);
  }, [total, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;

  async function onRandom() {
    try {
      const r = await fetchRandomPokemon({ include_forms: includeForms });
      const id = r?.id ?? r?.pokemon?.id;
      if (id) navigate(`/pokemon/${id}`);
    } catch {
      /* transient network error — leave the user where they are */
    }
  }

  return (
    <div className="dex">
      <div className="dex__controls">
        <input
          className="dex__input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search Pokédex..."
        />

        <select
          className="dex__select"
          value={type}
          onChange={e => setType(e.target.value)}
          aria-label="Type"
        >
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className="dex__select"
          value={generation}
          onChange={e => setGeneration(e.target.value)}
          aria-label="Generation"
        >
          <option value="">All generations</option>
          {GENERATIONS.map(g => <option key={g} value={g}>Gen {g}</option>)}
        </select>

        <select
          className="dex__select"
          value={rarity}
          onChange={e => setRarity(e.target.value)}
          aria-label="Rarity"
        >
          <option value="">All rarities</option>
          <option value="legendary">Legendary &amp; Mythical</option>
          <option value="regular">Regular</option>
        </select>

        <label className="dex__field">
          <span className="dex__field-label">Sort by</span>
          <select
            className="dex__select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="dex__btn"
          onClick={() => setOrder(o => (o === "asc" ? "desc" : "asc"))}
          title={order === "asc" ? "Ascending" : "Descending"}
          aria-label={order === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {order === "asc" ? "▲" : "▼"}
        </button>

        <label className="dex__check">
          <input
            type="checkbox"
            checked={includeForms}
            onChange={e => setIncludeForms(e.target.checked)}
          />
          Include forms
        </label>

        <button
          type="button"
          className={`dex__btn${favoritesOnly ? " dex__btn--on" : ""}`}
          onClick={() => {
            if (!favoritesOnly) setFavLoading(true); // no empty-state flash pre-fetch
            setFavoritesOnly(!favoritesOnly);
          }}
          aria-pressed={favoritesOnly}
        >
          ★ Favorites
        </button>
      </div>

      <div className="dex__meta">
        {loading ? "Loading…" : `Showing ${rows?.length ?? 0} of ${total}`}
      </div>

      {err && (
        <div className="dex__error">
          Error: {String(err.message || err)}
        </div>
      )}

      {!loading && favoritesOnly && total === 0 && (
        <div className="dex__empty">
          No favorites yet — tap the ☆ on a card to save one.
        </div>
      )}

      <div className="dex__grid">
        {!loading && rows && rows.map(p => (
          <PokedexCard key={p.id} p={p} onFavoriteChange={onFavoriteChange} />
        ))}
      </div>

      <div className="dex__pager">
        <button
          type="button"
          className="dex__page-btn"
          disabled={!canPrev}
          onClick={() => setPage(p => p - 1)}
        >
          Prev
        </button>
        <span className="dex__page-label">Page {page + 1} of {totalPages}</span>
        <button
          type="button"
          className="dex__page-btn"
          disabled={!canNext}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
        <button type="button" className="dex__btn" onClick={onRandom}>
          🎲 Random
        </button>
        <ScrollButton />
      </div>
    </div>
  );
}
