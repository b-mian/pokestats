import React, { useState } from "react";
import { usePokemon } from "../api/hooks";

export default function PokedexList() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");
  const limit = 20;

  const { data, count, loading } = usePokemon({
    q: q || undefined,
    type: type || undefined,
    sort,
    order,
    limit,
    offset: page * limit
  });

  const canPrev = page > 0;
  const canNext = (page + 1) * limit < count;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(0); }}
          placeholder="Search by name or ID"
          style={{ padding: 8, minWidth: 220 }}
        />
        <input
          value={type}
          onChange={e => { setType(e.target.value); setPage(0); }}
          placeholder="Type filter (e.g. fire)"
          style={{ padding: 8, minWidth: 180 }}
        />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: 8 }}>
          {["id","name","hp","attack","defense","speed","generation"].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)} style={{ padding: 8 }}>
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </div>

      <div style={{ margin: "6px 0 12px", color: "#666" }}>
        {loading ? "Loading…" : `Showing ${data.length} of ${count}`}
      </div>

      {!loading && data.length === 0 && (
        <div style={{ padding: "24px 0", color: "#777" }}>
          No Pokémon found. Try clearing filters.
        </div>
      )}

      {data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={{ padding: "8px 6px" }}>#</th>
                <th style={{ padding: "8px 6px" }}>Name</th>
                <th style={{ padding: "8px 6px" }}>Types</th>
                <th style={{ padding: "8px 6px" }}>HP</th>
                <th style={{ padding: "8px 6px" }}>Atk</th>
                <th style={{ padding: "8px 6px" }}>Def</th>
                <th style={{ padding: "8px 6px" }}>Spe</th>
                <th style={{ padding: "8px 6px" }}>Gen</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                  <td style={{ padding: "8px 6px", fontVariantNumeric: "tabular-nums" }}>{p.id}</td>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: "8px 6px" }}>{p.type1}{p.type2 ? ` / ${p.type2}` : ""}</td>
                  <td style={{ padding: "8px 6px" }}>{p.hp}</td>
                  <td style={{ padding: "8px 6px" }}>{p.attack}</td>
                  <td style={{ padding: "8px 6px" }}>{p.defense}</td>
                  <td style={{ padding: "8px 6px" }}>{p.speed}</td>
                  <td style={{ padding: "8px 6px" }}>{p.generation ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button disabled={!canPrev} onClick={() => setPage(p => p - 1)}>Prev</button>
        <button disabled={!canNext} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}