import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TypePill from "./TypePill";
import { prettyName, STAT_LABELS } from "../utils/format";
import { spriteUrl } from "../utils/sprites";
import { isFavorite, toggleFavorite } from "../utils/favorites";
import "./styles/pokedex.css";

// Exactly 10 cells, laid out row-wise into a 2 x 5 grid.
const STAT_CELLS = [
  "hp", "attack",
  "defense", "sp_attack",
  "sp_defense", "speed",
  "bst", "height_m",
  "weight_kg", "base_experience",
];

const EM_DASH = "—";

function formatStat(key, p) {
  const v = p?.[key];
  if (v === null || v === undefined || v === "") return EM_DASH;
  const n = Number(v);
  if (key === "height_m") return Number.isFinite(n) ? `${n.toFixed(1)} m` : EM_DASH;
  if (key === "weight_kg") return Number.isFinite(n) ? `${n.toFixed(1)} kg` : EM_DASH;
  return Number.isFinite(n) ? String(n) : String(v);
}

/**
 * One Pokédex entry: sprite, identity, type pills and a 2x5 stat grid.
 * The whole card navigates to the detail page; the star toggles favorites.
 */
export default function PokedexCard({ p, onFavoriteChange }) {
  const navigate = useNavigate();
  const [fav, setFav] = useState(() => isFavorite(p.id));

  // Keep in sync if the same id is re-rendered into this slot (paging/filtering).
  useEffect(() => { setFav(isFavorite(p.id)); }, [p.id]);

  const name = prettyName(p.name);
  const rarity = p.is_mythical ? "Mythical" : (p.is_legendary ? "Legendary" : null);

  function go() {
    navigate(`/pokemon/${p.id}`);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  }

  function onStar(e) {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(p.id);
    const next = isFavorite(p.id);
    setFav(next);
    if (onFavoriteChange) onFavoriteChange(p.id, next);
  }

  return (
    <div
      className="dex-card"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKeyDown}
      aria-label={`${name}, number ${p.id}`}
    >
      <button
        type="button"
        className={`dex-card__fav${fav ? " dex-card__fav--on" : ""}`}
        onClick={onStar}
        aria-pressed={fav}
        title={fav ? "Remove from favorites" : "Add to favorites"}
      >
        {fav ? "★" : "☆"}
      </button>

      <img
        src={spriteUrl(p.id)}
        alt={name}
        className="dex-card__sprite"
        loading="lazy"
        width={96}
        height={96}
      />

      <div className="dex-card__title">
        {name} <span className="dex-card__id">#{p.id}</span>
      </div>

      {p.form_name ? (
        <div className="dex-card__form">{prettyName(p.form_name)}</div>
      ) : null}

      <div className="dex-card__types">
        <TypePill type={p.type1} size="sm" />
        {p.type2 ? <TypePill type={p.type2} size="sm" /> : null}
      </div>

      {rarity ? <div className="dex-card__badge">{rarity}</div> : null}

      <div className="dex-card__stats">
        {STAT_CELLS.map(key => (
          <div className="dex-card__stat" key={key}>
            <div className="dex-card__stat-label">{STAT_LABELS[key]}</div>
            <div className="dex-card__stat-value">{formatStat(key, p)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
