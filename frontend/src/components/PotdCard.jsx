import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPokemonOfTheDay } from "../api/client";
import { prettyName } from "../utils/format";
import { artworkUrl, spriteUrl } from "../utils/sprites";
import TypePill from "./TypePill";
import "./styles/pokedex.css";

/**
 * Compact featured card for the day's Pokémon. Renders nothing if the
 * endpoint fails, so a hiccup never breaks the surrounding menu.
 */
export default function PotdCard() {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancel = false;
    fetchPokemonOfTheDay()
      .then(d => { if (!cancel) { setP(d); setErr(null); } })
      .catch(e => { if (!cancel) setErr(e); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, []);

  if (err) return null;

  return (
    <div className="potd">
      <div className="potd__title">Pokémon of the Day</div>

      {loading || !p ? (
        <div className="potd__loading">Loading…</div>
      ) : (
        <Link className="potd__link" to={`/pokemon/${p.id}`}>
          <img
            className="potd__art"
            src={artworkUrl(p.id)}
            alt={prettyName(p.name)}
            width={140}
            height={140}
            loading="lazy"
            onError={e => {
              if (e.currentTarget.dataset.fallback) return;
              e.currentTarget.dataset.fallback = "1";
              e.currentTarget.src = spriteUrl(p.id);
            }}
          />
          <div className="potd__name">
            {prettyName(p.name)} <span className="potd__id">#{p.id}</span>
          </div>
          <div className="potd__types">
            <TypePill type={p.type1} size="sm" />
            {p.type2 ? <TypePill type={p.type2} size="sm" /> : null}
          </div>
        </Link>
      )}
    </div>
  );
}
