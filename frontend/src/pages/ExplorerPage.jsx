import React, { useEffect, useMemo, useState } from "react";
import { Scatter } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { fetchPokemon } from "../api/client";
import { prettyName, typeColor, STAT_LABELS } from "../utils/format";
import { ALL_TYPES } from "../utils/typeMatchups";
import TypePill from "../components/TypePill";
import "../components/styles/explorer.css";

// Numeric fields the user can put on either axis. Labels come from STAT_LABELS.
const AXIS_KEYS = [
  "hp", "attack", "defense", "sp_attack", "sp_defense", "speed",
  "bst", "height_m", "weight_kg", "base_experience",
];

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// A row is plottable on an axis only if that field is a real number.
function numeric(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export default function ExplorerPage() {
  const navigate = useNavigate();

  // Axis selection — changing these re-maps the rows we already have, no refetch.
  const [xKey, setXKey] = useState("attack");
  const [yKey, setYKey] = useState("speed");

  // Query filters — changing any of these refetches.
  const [generation, setGeneration] = useState("");
  const [type, setType] = useState("");
  const [legendaryOnly, setLegendaryOnly] = useState(false);
  const [includeForms, setIncludeForms] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchPokemon({
          limit: 2000,
          offset: 0,
          generation: generation || undefined,
          type: type || undefined,
          legendary: legendaryOnly ? true : undefined,
          include_forms: includeForms,
        });
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
        setErr(null);
      } catch (e) {
        if (!cancelled) { setErr(e); setRows([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [generation, type, legendaryOnly, includeForms]);

  // One pass builds the points, the per-point colors, and the parallel row list
  // that tooltips and clicks index into — they must stay in lockstep.
  const { chartData, plottedRows } = useMemo(() => {
    const points = [];
    const fills = [];
    const borders = [];
    const kept = [];

    for (const row of rows) {
      if (!numeric(row[xKey]) || !numeric(row[yKey])) continue;
      points.push({ x: Number(row[xKey]), y: Number(row[yKey]) });
      const color = typeColor(row.type1);
      fills.push(`${color}C0`); // ~75% alpha
      borders.push(color);
      kept.push(row);
    }

    return {
      plottedRows: kept,
      chartData: {
        datasets: [{
          label: "Pokémon",
          data: points,
          pointBackgroundColor: fills,
          pointBorderColor: borders,
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 7,
        }],
      },
    };
  }, [rows, xKey, yKey]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: STAT_LABELS[xKey] }, beginAtZero: true },
      y: { title: { display: true, text: STAT_LABELS[yKey] }, beginAtZero: true },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const row = plottedRows[ctx.dataIndex];
            if (!row) return "";
            return `${prettyName(row.name)} #${row.id} — ${STAT_LABELS[xKey]}: ${ctx.parsed.x}, ${STAT_LABELS[yKey]}: ${ctx.parsed.y}`;
          },
        },
      },
    },
    onClick: (evt, elements) => {
      if (elements?.length) {
        const row = plottedRows[elements[0].index];
        if (row) navigate(`/pokemon/${row.id}`);
      }
    },
    onHover: (evt, elements) => {
      const target = evt?.native?.target;
      if (target) target.style.cursor = elements?.length ? "pointer" : "default";
    },
  }), [xKey, yKey, plottedRows, navigate]);

  return (
    <div className="explorer">
      <header className="explorer__header">
        <h2 className="explorer__title">Stat Explorer</h2>
        <p className="explorer__subtitle">
          Every Pokémon plotted by any two stats — click a point to open it.
        </p>
      </header>

      <div className="explorer__controls">
        <label className="explorer__field">
          <span className="explorer__label">X axis</span>
          <select className="explorer__select" value={xKey} onChange={e => setXKey(e.target.value)}>
            {AXIS_KEYS.map(k => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
          </select>
        </label>

        <label className="explorer__field">
          <span className="explorer__label">Y axis</span>
          <select className="explorer__select" value={yKey} onChange={e => setYKey(e.target.value)}>
            {AXIS_KEYS.map(k => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
          </select>
        </label>

        <label className="explorer__field">
          <span className="explorer__label">Generation</span>
          <select className="explorer__select" value={generation} onChange={e => setGeneration(e.target.value)}>
            <option value="">All generations</option>
            {GENERATIONS.map(g => <option key={g} value={g}>Gen {g}</option>)}
          </select>
        </label>

        <label className="explorer__field">
          <span className="explorer__label">Type</span>
          <select className="explorer__select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{prettyName(t)}</option>)}
          </select>
        </label>

        <label className="explorer__check">
          <input
            type="checkbox"
            checked={legendaryOnly}
            onChange={e => setLegendaryOnly(e.target.checked)}
          />
          <span>Legendary &amp; Mythical only</span>
        </label>

        <label className="explorer__check">
          <input
            type="checkbox"
            checked={includeForms}
            onChange={e => setIncludeForms(e.target.checked)}
          />
          <span>Include alternate forms</span>
        </label>
      </div>

      <div className="explorer__meta">
        {loading
          ? "Loading Pokémon…"
          : err
            ? <span className="explorer__error">Could not load Pokémon: {err.message}</span>
            : <>Showing {plottedRows.length} Pokémon {type ? <TypePill type={type} /> : null}</>}
      </div>

      <div className="explorer__card explorer__chart-card">
        <div className="explorer__chart">
          {!loading && !err && plottedRows.length === 0 ? (
            <div className="explorer__empty">No Pokémon match these filters.</div>
          ) : (
            <Scatter data={chartData} options={options} />
          )}
        </div>
      </div>

      <div className="explorer__card explorer__legend-card">
        <div className="explorer__legend-title">Point color = primary type (click to filter)</div>
        <div className="explorer__legend">
          {ALL_TYPES.map(t => (
            <button
              key={t}
              type="button"
              className={`explorer__chip${type === t ? " explorer__chip--active" : ""}`}
              style={{ background: typeColor(t) }}
              onClick={() => setType(prev => (prev === t ? "" : t))}
            >
              {prettyName(t)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
