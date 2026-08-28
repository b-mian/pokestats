import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchRandomPokemon } from "../api/client";
import { prettyName, STAT_LABELS } from "../utils/format";
import { artworkUrl, spriteUrl } from "../utils/sprites";
import "../components/styles/games.css";

const STATS = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed", "bst"];
const BEST_KEY = "pokestats.higherlower.best";
const REVEAL_MS = 1200;

/** Stored best streak; null when absent or storage is unavailable. */
function readBest() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    return null;
  }
}

function writeBest(streak) {
  try {
    window.localStorage.setItem(BEST_KEY, String(streak));
  } catch (e) {
    /* private mode / storage disabled — the streak just won't persist */
  }
}

function statValue(p, stat) {
  const v = p ? p[stat] : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Pick a random stat both Pokémon actually carry a number for. */
function pickStat(a, b) {
  const usable = STATS.filter((s) => statValue(a, s) !== null && statValue(b, s) !== null);
  const pool = usable.length ? usable : ["bst"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function artFallback(id) {
  return (e) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = spriteUrl(id);
  };
}

function Card({ p, stat, hideValue, tone }) {
  if (!p) return <div className="hl-card" />;
  const name = prettyName(p.name);
  const value = statValue(p, stat);
  const toneClass = tone ? ` hl-card--${tone}` : "";
  return (
    <div className={`hl-card${toneClass}`}>
      <img
        src={artworkUrl(p.id)}
        onError={artFallback(p.id)}
        alt={name}
        className="hl-card__art"
        width={200}
        height={200}
      />
      <div className="hl-card__name">
        {name} <span className="hl-card__id">#{p.id}</span>
      </div>
      <div className="hl-card__stat">{STAT_LABELS[stat] || stat}</div>
      <div className={`hl-card__value${hideValue ? " hl-card__value--hidden" : ""}`}>
        {hideValue ? "?" : value === null ? "—" : value}
      </div>
    </div>
  );
}

export default function HigherLowerPage() {
  // "loading" | "guess" | "reveal-correct" | "reveal-wrong" | "gameover"
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [stat, setStat] = useState("bst");
  const [guess, setGuess] = useState(null); // "higher" | "lower"

  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => readBest());
  const [isNewBest, setIsNewBest] = useState(false);

  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);

  const startGame = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setGuess(null);
    setIsNewBest(false);
    setStreak(0);
    try {
      const first = await fetchRandomPokemon({});
      const second = await fetchRandomPokemon({ exclude: first.id });
      if (!aliveRef.current) return;
      setA(first);
      setB(second);
      setStat(pickStat(first, second));
      setPhase("guess");
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err && err.message ? err.message : "Could not reach the Pokédex.");
      setPhase("gameover");
    }
  }, []);

  useEffect(() => { startGame(); }, [startGame]);

  // Correct guess: hold the reveal, then promote the challenger to champion,
  // roll a fresh stat and fetch the next challenger.
  useEffect(() => {
    if (phase !== "reveal-correct") return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const newA = b;
      if (!newA) return;
      try {
        const newB = await fetchRandomPokemon({ exclude: newA.id });
        if (cancelled || !aliveRef.current) return;
        setA(newA);
        setB(newB);
        setStat(pickStat(newA, newB));
        setGuess(null);
        setPhase("guess");
      } catch (err) {
        if (cancelled || !aliveRef.current) return;
        setError(err && err.message ? err.message : "Could not load the next Pokémon.");
        setPhase("gameover");
      }
    }, REVEAL_MS);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [phase, b]);

  // Wrong guess: hold the reveal, then bank the streak and show the summary.
  useEffect(() => {
    if (phase !== "reveal-wrong") return undefined;
    const timer = window.setTimeout(() => {
      const prev = readBest();
      if (prev === null || streak > prev) {
        writeBest(streak);
        setBest(streak);
        setIsNewBest(streak > (prev === null ? 0 : prev));
      } else {
        setBest(prev);
        setIsNewBest(false);
      }
      setPhase("gameover");
    }, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [phase, streak]);

  function onGuess(direction) {
    if (phase !== "guess" || !a || !b) return; // also blocks double-clicks
    const av = statValue(a, stat);
    const bv = statValue(b, stat);
    if (av === null || bv === null) return;
    // Ties count as correct in either direction.
    const isCorrect = direction === "higher" ? bv >= av : bv <= av;
    setGuess(direction);
    if (isCorrect) {
      setStreak((s) => s + 1);
      setPhase("reveal-correct");
    } else {
      setPhase("reveal-wrong");
    }
  }

  const statLabel = STAT_LABELS[stat] || stat;
  const revealing = phase === "reveal-correct" || phase === "reveal-wrong";

  // ------------------------------------------------------------- gameover

  if (phase === "gameover") {
    return (
      <div className="game-page">
        <h2 className="game-page__title">Higher or Lower</h2>
        {error ? <div className="game-error">{error}</div> : null}
        <div className="game-card game-center">
          {error ? null : (
            <>
              <div className="game-note">Final streak</div>
              <div className="hl-final">{streak}</div>
              <div>
                <span className="result-best">Best streak: {best === null ? "—" : best}</span>
                {isNewBest ? <span className="result-newbest">New best!</span> : null}
              </div>
            </>
          )}
          <div className="game-btn-row">
            <button type="button" className="game-btn game-btn--lg" onClick={startGame}>
              {error ? "Try again" : "Play again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- loading

  if (phase === "loading" || !a || !b) {
    return (
      <div className="game-page">
        <h2 className="game-page__title">Higher or Lower</h2>
        <div className="game-card game-center">
          <p className="game-note">Shuffling the Pokédex…</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- play

  return (
    <div className="game-page">
      <h2 className="game-page__title">Higher or Lower</h2>
      <p className="game-page__lede">
        Guess how the challenger's stat stacks up against the champion. Ties count as a win.
      </p>

      <div className="hl-stats">
        <span className="hl-chip hl-chip--streak">🔥 Streak {streak}</span>
        <span className="hl-chip">🏆 Best {best === null ? 0 : best}</span>
      </div>

      <div className="game-card">
        <p className="hl-question">
          Does <em>{prettyName(b.name)}</em> have HIGHER or LOWER <em>{statLabel}</em> than{" "}
          <em>{prettyName(a.name)}</em>?
        </p>

        <div className="hl-board">
          <Card p={a} stat={stat} hideValue={false} tone={null} />
          <div className="hl-vs">VS</div>
          <Card
            p={b}
            stat={stat}
            hideValue={!revealing}
            tone={phase === "reveal-correct" ? "correct" : phase === "reveal-wrong" ? "wrong" : null}
          />
        </div>

        <div className="hl-buttons">
          <button
            type="button"
            className="hl-guess"
            onClick={() => onGuess("higher")}
            disabled={phase !== "guess"}
          >
            ⬆ Higher
          </button>
          <button
            type="button"
            className="hl-guess"
            onClick={() => onGuess("lower")}
            disabled={phase !== "guess"}
          >
            ⬇ Lower
          </button>
        </div>

        <div
          className={`hl-feedback${
            phase === "reveal-correct" ? " hl-feedback--good" : phase === "reveal-wrong" ? " hl-feedback--bad" : ""
          }`}
        >
          {phase === "reveal-correct"
            ? `✅ Correct — ${prettyName(b.name)} is next up…`
            : phase === "reveal-wrong"
            ? `❌ Wrong — you guessed ${guess}. Streak ends at ${streak}.`
            : " "}
        </div>
      </div>
    </div>
  );
}
