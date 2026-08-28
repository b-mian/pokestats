import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Radar } from "react-chartjs-2";

import { fetchPokemonById } from "../api/client";
import { useTypeChart } from "../api/hooks";
import { prettyName, STAT_KEYS, STAT_LABELS } from "../utils/format";
import { headToHead } from "../utils/typeMatchups";
import { spriteUrl } from "../utils/sprites";
import TypePill from "../components/TypePill";
import PokemonPicker from "../components/PokemonPicker";
import "../components/styles/compare.css";

const MAX_COMPARE = 4;

// Dataset colors, applied in selection order.
const PALETTE = ["#0f8b8d", "#e4572e", "#7a5195", "#ffa600"];

// Table rows: every one of these is "higher is better", so the highlight rule
// is uniform (see bestValue below).
const TABLE_ROWS = [
  ...STAT_KEYS.map(key => ({ key, label: STAT_LABELS[key] })),
  { key: "bst", label: "BST" },
  { key: "height_m", label: "Height (m)" },
  { key: "weight_kg", label: "Weight (kg)" },
  { key: "base_experience", label: "Base XP" },
];

/** "6,9,x,6" -> [6, 9] : integers only, deduped, capped at MAX_COMPARE. */
function parseIds(raw) {
  const out = [];
  for (const part of String(raw || "").split(",")) {
    const n = Number(part.trim());
    if (!Number.isInteger(n) || n <= 0) continue;
    if (out.includes(n)) continue;
    out.push(n);
    if (out.length === MAX_COMPARE) break;
  }
  return out;
}

/** "#0f8b8d" + 0.2 -> "rgba(15,139,141,0.2)" — Chart.js fills need alpha. */
function withAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function typesOf(p) {
  return [p.type1, p.type2].filter(Boolean);
}

/** Highest value in a row, ignoring nulls. null when the row is entirely empty. */
function bestValue(list, key) {
  let best = null;
  for (const p of list) {
    const v = p[key];
    if (v === null || v === undefined || Number.isNaN(Number(v))) continue;
    const n = Number(v);
    if (best === null || n > best) best = n;
  }
  return best;
}

function formatCell(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

/** 0 | 0.25 | 0.5 | 1 | 2 | 4 -> display glyph. */
function formatMultiplier(m) {
  if (m === 0.25) return "¼";
  if (m === 0.5) return "½";
  return String(m);
}

function multiplierTone(m) {
  if (m === 0) return "zero";
  if (m >= 2) return "good";
  if (m === 1) return "neutral";
  return "bad"; // 0.5 and 0.25
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeChart = useTypeChart();

  const idsParam = searchParams.get("ids") || "";
  const ids = useMemo(() => parseIds(idsParam), [idsParam]);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(ids.length > 0);

  // The URL is the single source of truth; every mutation round-trips through it.
  const writeIds = useCallback(
    nextIds => {
      const clean = parseIds(nextIds.join(","));
      const params = new URLSearchParams(searchParams);
      if (clean.length) params.set("ids", clean.join(","));
      else params.delete("ids");
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (!ids.length) {
      setList([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      // Per-promise catch: one dead id must not blank the whole comparison.
      const rows = await Promise.all(
        ids.map(id => fetchPokemonById(id).catch(() => null))
      );
      if (cancelled) return;
      setList(rows.filter(Boolean)); // order preserved by Promise.all
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  // Derive the next id list from what actually loaded, so ids that failed to
  // resolve fall out of the URL on the user's next action rather than on a
  // transient fetch error.
  const handleAdd = useCallback(
    p => writeIds([...list.map(x => x.id), p.id]),
    [list, writeIds]
  );

  const handleRemove = useCallback(
    id => writeIds(list.filter(x => x.id !== id).map(x => x.id)),
    [list, writeIds]
  );

  const full = list.length >= MAX_COMPARE;
  const selectedIds = list.map(p => p.id);

  const radarData = useMemo(
    () => ({
      labels: STAT_KEYS.map(k => STAT_LABELS[k]),
      datasets: list.map((p, i) => {
        const color = PALETTE[i % PALETTE.length];
        return {
          label: prettyName(p.name),
          data: STAT_KEYS.map(k => p[k] ?? 0),
          borderColor: color,
          backgroundColor: withAlpha(color, 0.2),
          pointBackgroundColor: color,
          pointRadius: 3,
          borderWidth: 2,
        };
      }),
    }),
    [list]
  );

  const radarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
      },
      scales: {
        r: {
          min: 0,
          suggestedMax: 160,
          ticks: { backdropColor: "transparent", color: "#7b8a94", stepSize: 40 },
          pointLabels: { color: "#24333c", font: { size: 13, weight: "600" } },
          grid: { color: "#e6ebee" },
          angleLines: { color: "#e6ebee" },
        },
      },
    }),
    []
  );

  const showH2H = list.length === 2 && !!typeChart;

  return (
    <div className="cmp-page">
      <h2 className="cmp-title">Compare Pokémon</h2>

      {/* ---------- selection ---------- */}
      {list.length === 0 && !loading ? (
        <div className="cmp-card cmp-empty">
          <p className="cmp-empty-text">
            Pick up to 4 Pokémon to compare their stats side by side.
          </p>
          <div className="cmp-empty-picker">
            <PokemonPicker
              onSelect={handleAdd}
              excludeIds={selectedIds}
              placeholder="Search for a Pokémon..."
              includeForms
            />
          </div>
        </div>
      ) : (
        <div className="cmp-card cmp-selection">
          <div className="cmp-chips">
            {list.map((p, i) => (
              <span
                key={p.id}
                className="cmp-chip"
                style={{ borderColor: PALETTE[i % PALETTE.length] }}
              >
                <img
                  className="cmp-chip-sprite"
                  src={spriteUrl(p.id)}
                  alt=""
                  width={36}
                  height={36}
                />
                <span className="cmp-chip-name">{prettyName(p.name)}</span>
                <button
                  type="button"
                  className="cmp-chip-remove"
                  onClick={() => handleRemove(p.id)}
                  aria-label={`Remove ${prettyName(p.name)}`}
                  title={`Remove ${prettyName(p.name)}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="cmp-add">
            {loading ? (
              <span className="cmp-loading">Loading…</span>
            ) : full ? (
              <span className="cmp-note">Maximum of 4</span>
            ) : (
              <PokemonPicker
                onSelect={handleAdd}
                excludeIds={selectedIds}
                placeholder="Add a Pokémon..."
                includeForms
              />
            )}
          </div>
        </div>
      )}

      {/* ---------- radar ---------- */}
      {list.length >= 1 && (
        <div className="cmp-card">
          <h3 className="cmp-card-title">Base stats</h3>
          <div className="cmp-radar">
            <Radar data={radarData} options={radarOptions} />
          </div>
          {list.length === 1 && (
            <p className="cmp-hint">Add another Pokémon to see the comparison table.</p>
          )}
        </div>
      )}

      {/* ---------- head-to-head types ---------- */}
      {showH2H && (
        <div className="cmp-card cmp-h2h">
          <h3 className="cmp-card-title">Type matchup</h3>
          {[
            [list[0], list[1]],
            [list[1], list[0]],
          ].map(([atk, def]) => {
            const m = headToHead(typeChart, typesOf(atk), typesOf(def));
            return (
              <p className="cmp-h2h-line" key={`${atk.id}-${def.id}`}>
                <strong>{prettyName(atk.name)}</strong> hits{" "}
                <strong>{prettyName(def.name)}</strong> at{" "}
                <span className={`cmp-mult cmp-mult--${multiplierTone(m)}`}>
                  {formatMultiplier(m)}×
                </span>
                {m === 0 && <span className="cmp-h2h-note"> (no effect)</span>}
              </p>
            );
          })}
        </div>
      )}

      {/* ---------- stats table ---------- */}
      {list.length >= 2 && (
        <div className="cmp-card">
          <h3 className="cmp-card-title">Side by side</h3>
          <div className="cmp-table-wrap">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th className="cmp-th-label" scope="col" />
                  {list.map((p, i) => (
                    <th key={p.id} scope="col">
                      <div
                        className="cmp-col-head"
                        style={{ borderTopColor: PALETTE[i % PALETTE.length] }}
                      >
                        <img
                          className="cmp-col-sprite"
                          src={spriteUrl(p.id)}
                          alt=""
                          width={64}
                          height={64}
                        />
                        <Link className="cmp-col-name" to={`/pokemon/${p.id}`}>
                          {prettyName(p.name)}
                        </Link>
                        <div className="cmp-col-types">
                          <TypePill type={p.type1} />
                          {p.type2 ? <TypePill type={p.type2} /> : null}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(row => {
                  const best = bestValue(list, row.key);
                  return (
                    <tr key={row.key}>
                      <th className="cmp-row-label" scope="row">
                        {row.label}
                      </th>
                      {list.map(p => {
                        const v = p[row.key];
                        const isBest =
                          best !== null &&
                          v !== null &&
                          v !== undefined &&
                          Number(v) === best;
                        return (
                          <td
                            key={p.id}
                            className={isBest ? "cmp-cell cmp-cell--best" : "cmp-cell"}
                          >
                            {formatCell(v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
