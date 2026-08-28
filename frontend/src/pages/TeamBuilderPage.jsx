import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchPokemonById, fetchRandomPokemon } from "../api/client";
import { useTypeChart } from "../api/hooks";
import { prettyName, STAT_KEYS, STAT_LABELS } from "../utils/format";
import { ALL_TYPES, teamDefense, teamOffense } from "../utils/typeMatchups";
import { spriteUrl } from "../utils/sprites";
import TypePill from "../components/TypePill";
import PokemonPicker from "../components/PokemonPicker";
import "../components/styles/team.css";

const MAX_TEAM = 6;
const SLOTS = [0, 1, 2, 3, 4, 5];
const RANDOM_MAX_ATTEMPTS = 20;
const STAT_BAR_MAX = 150; // a ~150 base stat fills the mini bar

/** Parse the `ids` query param into a clean, deduped, capped list of ids. */
function parseIds(raw) {
  const out = [];
  for (const chunk of String(raw || "").split(",")) {
    const n = Number(chunk.trim());
    if (!Number.isInteger(n) || n <= 0) continue;
    if (out.includes(n)) continue;
    out.push(n);
    if (out.length >= MAX_TEAM) break;
  }
  return out;
}

/** BST straight from the row, with a defensive fallback to the stat sum. */
function bstOf(p) {
  if (typeof p.bst === "number") return p.bst;
  return STAT_KEYS.reduce((sum, k) => sum + (Number(p[k]) || 0), 0);
}

/** Bucket a type-effectiveness multiplier into a label + css modifier. */
function multBadge(m) {
  if (m === 0) return { label: "0×", mod: "zero" };
  if (m >= 4) return { label: "4×", mod: "x4" };
  if (m >= 2) return { label: "2×", mod: "x2" };
  if (m <= 0.25) return { label: "¼×", mod: "quarter" };
  if (m <= 0.5) return { label: "½×", mod: "half" };
  return { label: "1×", mod: "x1" };
}

function countChipClass(kind, n) {
  if (n <= 0) return "tb-chip tb-chip--zero";
  if (kind === "weak") return `tb-chip tb-chip--weak${n >= 2 ? " tb-chip--weak-strong" : ""}`;
  if (kind === "resist") return "tb-chip tb-chip--resist";
  return "tb-chip tb-chip--immune";
}

export default function TeamBuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = useMemo(() => parseIds(idsParam), [idsParam]);
  const idsKey = ids.join(",");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  const rowCache = useRef(new Map()); // id -> row, so re-ordering never refetches
  const latestIds = useRef(ids); // async writes must not resurrect removed slots
  latestIds.current = ids;

  const chart = useTypeChart();

  // Team lives in the URL — every mutation goes through here.
  const writeIds = useCallback((nextIds, replace = false) => {
    const clean = parseIds(nextIds.join(","));
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (clean.length) next.set("ids", clean.join(","));
        else next.delete("ids");
        return next;
      },
      { replace }
    );
  }, [setSearchParams]);

  // Resolve the ids in the URL to full rows; ids that fail to fetch are dropped.
  useEffect(() => {
    if (!idsKey) { setMembers([]); setLoading(false); return undefined; }
    let cancel = false;
    const wanted = idsKey.split(",").map(Number);
    const missing = wanted.filter(id => !rowCache.current.has(id));
    if (missing.length) setLoading(true);
    Promise.all(
      wanted.map(id => {
        const hit = rowCache.current.get(id);
        if (hit) return Promise.resolve(hit);
        return fetchPokemonById(id)
          .then(row => { rowCache.current.set(id, row); return row; })
          .catch(() => null);
      })
    )
      .then(rows => {
        if (cancel) return;
        const ok = rows.filter(Boolean);
        setMembers(ok);
        if (ok.length !== wanted.length) writeIds(ok.map(r => r.id), true);
      })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [idsKey, writeIds]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const full = ids.length >= MAX_TEAM;

  const addMember = useCallback(p => {
    if (!p || full || ids.includes(p.id)) return;
    writeIds([...ids, p.id]);
  }, [ids, full, writeIds]);

  const removeMember = useCallback(id => {
    writeIds(ids.filter(x => x !== id));
  }, [ids, writeIds]);

  // Fill every empty slot with distinct randoms, bounded by an attempt counter.
  const surpriseMe = useCallback(async () => {
    const need = MAX_TEAM - ids.length;
    if (need <= 0 || rolling) return;
    setRolling(true);
    const taken = new Set(ids);
    const picked = [];
    let last = ids.length ? ids[ids.length - 1] : null;
    let attempts = 0;
    while (picked.length < need && attempts < RANDOM_MAX_ATTEMPTS) {
      attempts += 1;
      try {
        // `exclude` only takes one id, so it just trims the most likely repeat.
        const p = await fetchRandomPokemon(last ? { exclude: last } : {});
        if (p && Number.isInteger(p.id) && !taken.has(p.id)) {
          taken.add(p.id);
          picked.push(p.id);
          last = p.id;
        }
      } catch {
        /* a failed roll just costs an attempt */
      }
    }
    setRolling(false);
    // Re-read the team: the user may have removed a slot while rolls were in flight.
    if (picked.length) writeIds([...latestIds.current, ...picked]);
  }, [ids, rolling, writeIds]);

  const shareTeam = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }, []);

  const teamTypes = useMemo(
    () => members.map(m => [m.type1, m.type2].filter(Boolean)),
    [members]
  );

  const defense = useMemo(
    () => (chart && teamTypes.length ? teamDefense(chart, teamTypes) : null),
    [chart, teamTypes]
  );
  const offense = useMemo(
    () => (chart && teamTypes.length ? teamOffense(chart, teamTypes) : null),
    [chart, teamTypes]
  );

  const summary = useMemo(() => {
    if (!members.length) return null;
    const n = members.length;
    const avgStats = {};
    for (const k of STAT_KEYS) {
      avgStats[k] = members.reduce((s, m) => s + (Number(m[k]) || 0), 0) / n;
    }
    return {
      count: n,
      avgBst: Math.round(members.reduce((s, m) => s + bstOf(m), 0) / n),
      avgStats,
    };
  }, [members]);

  const showAnalysis = members.length > 0 && !!chart;

  return (
    <div className="tb-page">
      <header className="tb-header">
        <h2 className="tb-title">Team Builder</h2>
        <p className="tb-subtitle">
          Build a team of up to six and see its type coverage. Your team lives in the
          page URL, so the link in your address bar is a shareable copy of this team.
        </p>
      </header>

      <section className="tb-card tb-team">
        <div className="tb-team__bar">
          <span className="tb-count">{ids.length}/{MAX_TEAM} slots filled</span>
          <div className="tb-team__actions">
            <button
              type="button"
              className="tb-btn tb-btn--ghost"
              onClick={surpriseMe}
              disabled={full || rolling}
            >
              {rolling ? "Rolling…" : "🎲 Surprise me"}
            </button>
            <button type="button" className="tb-btn" onClick={shareTeam}>
              {copied ? "Link copied!" : "Share team"}
            </button>
          </div>
        </div>

        <div className="tb-slots">
          {SLOTS.map(i => {
            const m = members[i];
            if (!m) {
              return (
                <div className="tb-slot tb-slot--empty" key={`empty-${i}`}>
                  <span>{loading && i < ids.length ? "Loading…" : "Empty slot"}</span>
                </div>
              );
            }
            return (
              <div className="tb-slot" key={m.id}>
                <button
                  type="button"
                  className="tb-slot__remove"
                  onClick={() => removeMember(m.id)}
                  aria-label={`Remove ${prettyName(m.name)} from team`}
                  title="Remove"
                >
                  &times;
                </button>
                <img
                  className="tb-slot__sprite"
                  src={spriteUrl(m.id)}
                  alt={prettyName(m.name)}
                  width={72}
                  height={72}
                  loading="lazy"
                />
                <Link className="tb-slot__name" to={`/pokemon/${m.id}`}>
                  {prettyName(m.name)}
                </Link>
                <div className="tb-slot__types">
                  <TypePill type={m.type1} />
                  {m.type2 ? <TypePill type={m.type2} /> : null}
                </div>
                <div className="tb-slot__bst">BST {bstOf(m)}</div>
              </div>
            );
          })}
        </div>

        <div className="tb-picker">
          {full ? (
            <span className="tb-full">Team full &mdash; {MAX_TEAM}/{MAX_TEAM}</span>
          ) : (
            <PokemonPicker
              onSelect={addMember}
              excludeIds={ids}
              includeForms
              placeholder="Add a Pokémon..."
            />
          )}
        </div>
      </section>

      {!showAnalysis ? (
        <section className="tb-card tb-hint">
          {members.length === 0
            ? "Add Pokémon to see team analysis"
            : "Loading type chart…"}
        </section>
      ) : (
        <>
          <section className="tb-card">
            <h3 className="tb-section-title">Defense &mdash; who covers what</h3>
            {defense.holes.length > 0 ? (
              <div className="tb-banner tb-banner--warn">
                <strong>
                  {"⚠️"} Uncovered weaknesses &mdash; no team member resists:
                </strong>
                <div className="tb-banner__pills">
                  {defense.holes.map(t => <TypePill key={t} type={t} />)}
                </div>
              </div>
            ) : (
              <div className="tb-banner tb-banner--ok">
                <strong>
                  {"✅"} Every attacking type that threatens you is resisted by someone.
                </strong>
              </div>
            )}

            <div className="tb-grid tb-grid--defense">
              {ALL_TYPES.map(t => {
                const row = defense.perType[t];
                return (
                  <div className="tb-row" key={t}>
                    <div className="tb-row__type"><TypePill type={t} /></div>
                    <div className="tb-row__chips">
                      <span className={countChipClass("weak", row.weak)}>weak {row.weak}</span>
                      <span className={countChipClass("resist", row.resist)}>resist {row.resist}</span>
                      <span className={countChipClass("immune", row.immune)}>immune {row.immune}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="tb-card">
            <h3 className="tb-section-title">Offense &mdash; STAB coverage</h3>
            {offense.uncovered.length > 0 ? (
              <div className="tb-banner tb-banner--warn">
                <strong>No super-effective STAB against:</strong>
                <div className="tb-banner__pills">
                  {offense.uncovered.map(t => <TypePill key={t} type={t} />)}
                </div>
              </div>
            ) : (
              <div className="tb-banner tb-banner--ok">
                <strong>{"✅"} Super-effective STAB coverage against every type.</strong>
              </div>
            )}

            <div className="tb-grid tb-grid--offense">
              {ALL_TYPES.map(t => {
                const badge = multBadge(offense.best[t]);
                return (
                  <div className="tb-cell" key={t}>
                    <TypePill type={t} />
                    <span className={`tb-mult tb-mult--${badge.mod}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="tb-card">
            <h3 className="tb-section-title">Team summary</h3>
            <div className="tb-summary__top">
              <div className="tb-stat-big">
                <span className="tb-stat-big__num">{summary.count}</span>
                <span className="tb-stat-big__label">
                  {summary.count === 1 ? "member" : "members"}
                </span>
              </div>
              <div className="tb-stat-big">
                <span className="tb-stat-big__num">{summary.avgBst}</span>
                <span className="tb-stat-big__label">average BST</span>
              </div>
            </div>
            <div className="tb-bars">
              {STAT_KEYS.map(k => {
                const avg = summary.avgStats[k];
                const pct = Math.min(100, (avg / STAT_BAR_MAX) * 100);
                return (
                  <div className="tb-bar-row" key={k}>
                    <span className="tb-bar-row__label">{STAT_LABELS[k]}</span>
                    <span className="tb-bar-row__track">
                      <span className="tb-bar-row__fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="tb-bar-row__val">{Math.round(avg)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
