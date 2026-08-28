import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Radar } from "react-chartjs-2";
import { usePokemonDetail, useTypeChart, useGenAverages } from "../api/hooks";
import { prettyName, STAT_LABELS } from "../utils/format";
import { defensiveMultipliers, groupMatchups } from "../utils/typeMatchups";
import { spriteUrl, artworkUrl } from "../utils/sprites";
import TypePill from "../components/TypePill";
import "../components/styles/detail.css";

// Stat bars and radar axes share this order.
const STAT_ORDER = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"];
const RADAR_LABELS = STAT_ORDER.map(k => STAT_LABELS[k]);

// /stats/gen/{g} returns values as [HP, Attack, Speed, Defense, Sp. Attack, Sp. Defense].
// These indices pull them into STAT_ORDER (Speed moves from 3rd to last).
const GEN_AVG_REORDER = [0, 1, 3, 4, 5, 2];

const MAX_STAT_FOR_BAR = 200;

const MATCHUP_ROWS = [
  ["x4", "Weak to (4×)", "detail-matchup--weak"],
  ["x2", "Weak to (2×)", "detail-matchup--weak"],
  ["x05", "Resists (½×)", "detail-matchup--resist"],
  ["x025", "Strongly resists (¼×)", "detail-matchup--resist"],
  ["x0", "Immune to (0×)", "detail-matchup--immune"],
];

const RADAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      suggestedMax: 160,
      ticks: { stepSize: 40, backdropColor: "transparent" },
      pointLabels: { font: { size: 12, weight: "700" } },
    },
  },
  plugins: { legend: { position: "bottom" } },
};

/** Render a possibly-null field, falling back to an em dash. */
function orDash(value) {
  return value === null || value === undefined || value === "" ? "—" : value;
}

/** "1.7 m" / "90.5 kg" — one decimal, matching the source data's precision. */
function withUnit(value, unit) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)} ${unit}` : "—";
}

/** How `speciesId` is reached from its predecessor, e.g. "Lv 16" / "Fire Stone". */
function evolutionCaption(edges, speciesId) {
  const edge = (edges || []).find(e => e.to_species_id === speciesId);
  if (!edge) return "";
  if (edge.min_level) return `Lv ${edge.min_level}`;
  if (edge.item) return prettyName(edge.item);
  return prettyName(edge.trigger || "");
}

/** Swap in the small sprite once if the official artwork 404s (and only once). */
function fallbackToSprite(id) {
  return e => {
    const img = e.currentTarget;
    if (img.dataset.fellBack) return;
    img.dataset.fellBack = "1";
    img.src = spriteUrl(id);
  };
}

function Centered({ children }) {
  return <div className="detail detail--centered">{children}</div>;
}

export default function DetailPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);

  const { data, loading, err } = usePokemonDetail(id);
  const typeChart = useTypeChart();
  // Hooks can't be conditional: fall back to gen 1 while `data` loads (a valid
  // request, so the hook never rejects) and gate rendering on the echoed
  // `generation` so a stale gen's averages never reach the chart.
  const genAvg = useGenAverages(data && data.generation ? data.generation : 1);

  const radarData = useMemo(() => {
    if (!data) return null;
    const datasets = [{
      label: prettyName(data.name),
      data: STAT_ORDER.map(k => data[k] ?? 0),
      backgroundColor: "rgba(15,139,141,0.30)",
      borderColor: "#0f8b8d",
      borderWidth: 2,
      pointBackgroundColor: "#0f8b8d",
      pointRadius: 3,
    }];
    if (genAvg && genAvg.generation === data.generation && Array.isArray(genAvg.values)) {
      datasets.push({
        label: `Gen ${data.generation} average`,
        data: GEN_AVG_REORDER.map(i => genAvg.values[i] ?? 0),
        backgroundColor: "rgba(150,150,170,0.12)",
        borderColor: "#99a",
        borderDash: [6, 4],
        borderWidth: 2,
        pointBackgroundColor: "#99a",
        pointRadius: 2,
      });
    }
    return { labels: RADAR_LABELS, datasets };
  }, [data, genAvg]);

  const matchups = useMemo(() => {
    if (!typeChart || !data) return null;
    return groupMatchups(defensiveMultipliers(typeChart, [data.type1, data.type2]));
  }, [typeChart, data]);

  // Chain members grouped into columns by evolution depth; branches (Eevee)
  // simply stack inside their stage's column.
  const stages = useMemo(() => {
    const members = data?.evolution_chain?.members || [];
    if (members.length <= 1) return [];
    const byStage = new Map();
    for (const m of members) {
      const s = m.stage ?? 0;
      if (!byStage.has(s)) byStage.set(s, []);
      byStage.get(s).push(m);
    }
    return Array.from(byStage.keys())
      .sort((a, b) => a - b)
      .map(stage => ({ stage, members: byStage.get(stage) }));
  }, [data]);

  if (loading) return <Centered><div className="detail__status">Loading…</div></Centered>;

  if (err || !data) {
    return (
      <Centered>
        <div className="detail__status">
          <h2>Pokémon not found</h2>
          <p>We couldn’t find #{rawId} in the Pokédex.</p>
          <Link to="/" className="detail__navlink">← Back to the Pokédex</Link>
        </div>
      </Centered>
    );
  }

  const abilities = data.abilities || [];
  const eggGroups = data.egg_groups || [];
  const forms = data.forms || [];
  const edges = data.evolution_chain?.edges || [];
  const chainMembers = data.evolution_chain?.members || [];
  const noMatchups = matchups && MATCHUP_ROWS.every(([key]) => !matchups[key]?.length);

  const facts = [
    ["Height", withUnit(data.height_m, "m")],
    ["Weight", withUnit(data.weight_kg, "kg")],
    ["Base XP", orDash(data.base_experience)],
    ["Capture Rate", orDash(data.capture_rate)],
    ["Base Happiness", orDash(data.base_happiness)],
    ["Generation", orDash(data.generation)],
    ["Egg Groups", eggGroups.length ? eggGroups.map(prettyName).join(", ") : "—"],
  ];

  return (
    <div className="detail">
      <div className="detail__topbar">
        <Link to="/" className="detail__navlink">← Pokédex</Link>
        <Link to={`/compare?ids=${id}`} className="detail__navlink">Compare this Pokémon →</Link>
      </div>

      {/* ---------------- Header ---------------- */}
      <section className="detail-card detail-hero">
        <div className="detail-hero__artwrap">
          <img
            className="detail-hero__art"
            src={artworkUrl(id)}
            alt={prettyName(data.name)}
            onError={fallbackToSprite(id)}
          />
        </div>

        <div className="detail-hero__info">
          <h1 className="detail-hero__name">
            {prettyName(data.name)} <span className="detail-hero__id">#{data.id}</span>
          </h1>
          {data.genus ? <div className="detail-hero__genus">{data.genus}</div> : null}

          <div className="detail-hero__types">
            <TypePill type={data.type1} size="md" />
            <TypePill type={data.type2} size="md" />
          </div>

          <div className="detail-hero__badges">
            {data.is_legendary ? <span className="detail-badge detail-badge--legendary">Legendary</span> : null}
            {data.is_mythical ? <span className="detail-badge detail-badge--mythical">Mythical</span> : null}
            {data.form_name ? (
              <span className="detail-badge detail-badge--form">Form: {prettyName(data.form_name)}</span>
            ) : null}
          </div>

          {data.flavor_text ? <p className="detail-hero__flavor">{data.flavor_text}</p> : null}

          <div className="detail-facts">
            {facts.map(([label, value]) => (
              <div className="detail-fact" key={label}>
                <div className="detail-fact__label">{label}</div>
                <div className="detail-fact__value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Abilities ---------------- */}
      <section className="detail-card">
        <h3>Abilities</h3>
        {abilities.length ? (
          <div className="detail-abilities">
            {abilities.map(a => (
              <span
                key={`${a.name}-${a.is_hidden ? "h" : "n"}`}
                className={"detail-ability" + (a.is_hidden ? " detail-ability--hidden" : "")}
              >
                {prettyName(a.name)}{a.is_hidden ? " (Hidden)" : ""}
              </span>
            ))}
          </div>
        ) : (
          <p className="detail-empty">No abilities listed.</p>
        )}
      </section>

      {/* ---------------- Base stats ---------------- */}
      <section className="detail-card">
        <h3>Base Stats</h3>
        <div className="detail-stats">
          <div className="detail-stats__bars">
            {STAT_ORDER.map(key => {
              const value = data[key] ?? 0;
              const pct = Math.min(100, (value / MAX_STAT_FOR_BAR) * 100);
              return (
                <div className="detail-bar" key={key}>
                  <span className="detail-bar__label">{STAT_LABELS[key]}</span>
                  <span className="detail-bar__value">{orDash(data[key])}</span>
                  <span className="detail-bar__track">
                    <span className="detail-bar__fill" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              );
            })}
            <div className="detail-bar detail-bar--total">
              <span className="detail-bar__label">BST</span>
              <span className="detail-bar__value">{orDash(data.bst)}</span>
              <span className="detail-bar__track" />
            </div>
          </div>

          <div className="detail-stats__radar">
            {radarData ? <Radar data={radarData} options={RADAR_OPTIONS} /> : null}
          </div>
        </div>
      </section>

      {/* ---------------- Type matchups ---------------- */}
      <section className="detail-card">
        <h3>Type Matchups</h3>
        {!matchups ? (
          <p className="detail-empty">Loading…</p>
        ) : noMatchups ? (
          <p className="detail-empty">Takes neutral damage from every type.</p>
        ) : (
          <div className="detail-matchups">
            {MATCHUP_ROWS.map(([key, label, tone]) => {
              const types = matchups[key] || [];
              if (!types.length) return null;
              return (
                <div className={`detail-matchup ${tone}`} key={key}>
                  <div className="detail-matchup__label">{label}</div>
                  <div className="detail-matchup__pills">
                    {types.map(t => <TypePill key={t} type={t} size="sm" />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- Evolution chain ---------------- */}
      <section className="detail-card">
        <h3>Evolution</h3>
        {chainMembers.length <= 1 || !stages.length ? (
          <p className="detail-empty">Does not evolve.</p>
        ) : (
          <div className="detail-evo">
            {stages.map((col, i) => (
              <React.Fragment key={col.stage}>
                {i > 0 ? <div className="detail-evo__arrow" aria-hidden="true">→</div> : null}
                <div className="detail-evo__stage">
                  {col.members.map(m => {
                    const caption = col.stage > 0 ? evolutionCaption(edges, m.species_id) : "";
                    const current = m.species_id === data.species_id;
                    return (
                      <Link
                        key={m.id}
                        to={`/pokemon/${m.id}`}
                        className={"detail-evo__member" + (current ? " detail-evo__member--current" : "")}
                      >
                        <img
                          className="detail-evo__sprite"
                          src={spriteUrl(m.id)}
                          alt={prettyName(m.name)}
                          width={72}
                          height={72}
                          loading="lazy"
                        />
                        <div className="detail-evo__name">{prettyName(m.name)}</div>
                        <div className="detail-evo__types">
                          <TypePill type={m.type1} size="sm" />
                          <TypePill type={m.type2} size="sm" />
                        </div>
                        {caption ? <div className="detail-evo__caption">{caption}</div> : null}
                      </Link>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- Other forms ---------------- */}
      {forms.length > 1 ? (
        <section className="detail-card">
          <h3>Forms</h3>
          <div className="detail-forms">
            {forms.map(f => (
              <Link
                key={f.id}
                to={`/pokemon/${f.id}`}
                className={"detail-form" + (f.id === data.id ? " detail-form--current" : "")}
              >
                <img
                  className="detail-form__sprite"
                  src={spriteUrl(f.id)}
                  alt={prettyName(f.name)}
                  width={64}
                  height={64}
                  loading="lazy"
                />
                <div className="detail-form__name">{prettyName(f.name)}</div>
                <div className="detail-form__types">
                  <TypePill type={f.type1} size="sm" />
                  <TypePill type={f.type2} size="sm" />
                </div>
                <div className="detail-form__bst">BST {orDash(f.bst)}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
