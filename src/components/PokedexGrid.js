import React, { useMemo, useState, useEffect } from "react";
import { usePokemon, useTypeFrequencies } from "../api/hooks";
import PokedexCard from "./PokedexCard";
import "./styles/pokedex.css";
import ScrollButton from "./ScrollButton";

const API_BASE = process.env.REACT_APP_POKESTATS_API || "http://127.0.0.1:8000";

export default function PokedexGrid() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");
  const limit = 25;

  const { data, count, loading, err } = usePokemon({
    q: q || undefined,
    type: type || undefined,
    sort,
    order,
    limit,
    offset: page * limit
  });

  // Log what we got
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("rows=", data?.length, "count=", count, "loading=", loading, "err=", err);
  }, [data, count, loading, err]);

  const slot1 = useTypeFrequencies(1);
  const slot2 = useTypeFrequencies(2);
  const types = useMemo(() => {
    const set = new Set();
    [...slot1, ...slot2].forEach(r => r?.type && set.add(r.type));
    return Array.from(set).sort();
  }, [slot1, slot2]);

  useEffect(() => { setPage(0); }, [q, type, sort, order]);

  const canPrev = page > 0;
  const canNext = (page + 1) * limit < (count || 0);

  return (
    <div className="dex">
      <div className="dex__controls">
        <input
            className="dex__input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search Pokédex..."
        />
        <select className="dex__select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="dex__meta">
        {loading ? "Loading…" : `Showing ${data?.length ?? 0} of ${count ?? 0}`}
        <span style={{ marginLeft: 8, color: "#999", fontSize: '28px', fontWeight: 'bold' }}></span>
      </div>

      {err && (
        <div style={{ color: "#b00020", marginBottom: 10 }}>
          Error: {String(err.message || err)}
        </div>
      )}

      <div className="dex__grid">
        {!loading && data && data.map(p => <PokedexCard key={p.id} p={p} />)}
      </div>

      <div className="dex__pager">
        <button style={{backgroundColor: '#3c5454', borderRadius: '12px', width: '80px', color: 'whitesmoke'}} disabled={!canPrev} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span> Page {page + 1} </span>
        <button style={{backgroundColor: '#3c5454', borderRadius: '12px', width: '80px', color: 'whitesmoke'}} disabled={!canNext} onClick={() => setPage(p => p + 1)}>Next</button>
        <ScrollButton />
      </div>
    </div>
  );
}