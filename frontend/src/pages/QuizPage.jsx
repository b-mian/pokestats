import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchQuiz } from "../api/client";
import { artworkUrl, spriteUrl } from "../utils/sprites";
import "../components/styles/quiz.css";
import "../components/styles/games.css";

const QUESTION_COUNT = 10;
const QUESTION_MS = 20000;
const TICK_MS = 100;

const DIFFICULTIES = [
  { key: "easy", name: "Easy", blurb: "Gen 1–2 · 3 question styles" },
  { key: "medium", name: "Medium", blurb: "Gen 1–6 · adds Pokédex entries" },
  { key: "hard", name: "Hard", blurb: "All gens · adds generation questions" },
];

const KIND_LABELS = {
  silhouette: "Silhouette",
  type: "Typing",
  higher_stat: "Stat check",
  flavor: "Pokédex entry",
  generation: "Generation",
};

function bestKey(difficulty) {
  return `pokestats.quiz.best.${difficulty}`;
}

/** Read the stored best score for a difficulty; null when absent/unreadable. */
function readBest(difficulty) {
  try {
    const raw = window.localStorage.getItem(bestKey(difficulty));
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    return null;
  }
}

function writeBest(difficulty, score) {
  try {
    window.localStorage.setItem(bestKey(difficulty), String(score));
  } catch (e) {
    /* private mode / storage disabled — scores just won't persist */
  }
}

/** Fall back from official artwork to the small sprite if the CDN 404s. */
function artFallback(id) {
  return (e) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = spriteUrl(id);
  };
}

/**
 * Flavor prompts arrive as `Which Pokémon ...? “<entry>”`. Split the lead-in
 * from the quoted entry so the entry can live in its own quote block.
 */
function splitFlavor(prompt) {
  const text = String(prompt || "");
  const open = text.indexOf("“");
  const close = text.lastIndexOf("”");
  if (open !== -1 && close > open) {
    return { lead: text.slice(0, open).trim(), quote: text.slice(open + 1, close).trim() };
  }
  return { lead: "Which Pokémon does this Pokédex entry describe?", quote: text };
}

export default function QuizPage() {
  // "start" | "loading" | "playing" | "done"
  const [phase, setPhase] = useState("start");
  const [error, setError] = useState(null);

  const [difficulty, setDifficulty] = useState("medium");
  const [timed, setTimed] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [msLeft, setMsLeft] = useState(QUESTION_MS);

  const [bestScore, setBestScore] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);

  const total = questions.length;
  const q = questions[current];

  const startQuiz = useCallback(async (diff) => {
    setPhase("loading");
    setError(null);
    try {
      const data = await fetchQuiz({ count: QUESTION_COUNT, difficulty: diff });
      if (!aliveRef.current) return;
      const list = Array.isArray(data && data.questions) ? data.questions : [];
      if (!list.length) throw new Error("The quiz came back empty. Try again.");
      setQuestions(list);
      setCurrent(0);
      setScore(0);
      setSelected(null);
      setShowAnswer(false);
      setTimedOut(false);
      setMsLeft(QUESTION_MS);
      setIsNewBest(false);
      setPhase("playing");
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err && err.message ? err.message : "Could not load the quiz.");
      setPhase("start");
    }
  }, []);

  // Per-question countdown. Keyed on `current` so a timer from an earlier
  // question can never fire into a later one; teardown also runs the moment
  // the question is answered or the quiz ends.
  useEffect(() => {
    if (!timed || phase !== "playing" || showAnswer) return undefined;
    setMsLeft(QUESTION_MS);
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const left = QUESTION_MS - (Date.now() - startedAt);
      if (left <= 0) {
        window.clearInterval(id);
        setMsLeft(0);
        setSelected(null);
        setTimedOut(true);
        setShowAnswer(true);
      } else {
        setMsLeft(left);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [current, timed, phase, showAnswer]);

  function handleOption(index) {
    if (showAnswer || !q) return;
    setSelected(index);
    setShowAnswer(true);
    if (index === q.answer) setScore((s) => s + 1);
  }

  function finish(finalScore) {
    const prev = readBest(difficulty);
    if (prev === null || finalScore > prev) {
      writeBest(difficulty, finalScore);
      setBestScore(finalScore);
      // A first-ever run only counts as a "best" if it actually scored.
      setIsNewBest(finalScore > (prev === null ? 0 : prev));
    } else {
      setBestScore(prev);
      setIsNewBest(false);
    }
    setPhase("done");
  }

  function handleNext() {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
      setTimedOut(false);
      setMsLeft(QUESTION_MS);
    } else {
      finish(score);
    }
  }

  function backToStart() {
    setPhase("start");
    setError(null);
    setQuestions([]);
  }

  // ---------------------------------------------------------------- start

  if (phase === "start" || phase === "loading") {
    const loading = phase === "loading";
    return (
      <div className="game-page">
        <h2 className="game-page__title">Poké Quiz</h2>
        <p className="game-page__lede">
          Ten questions pulled fresh from the Pokédex. Pick a difficulty to begin.
        </p>

        {error ? <div className="game-error">{error}</div> : null}

        <div className="game-card">
          <div className="diff-grid">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`diff-card${difficulty === d.key ? " diff-card--active" : ""}`}
                onClick={() => setDifficulty(d.key)}
                disabled={loading}
                aria-pressed={difficulty === d.key}
              >
                <div className="diff-card__name">{d.name}</div>
                <div className="diff-card__blurb">{d.blurb}</div>
              </button>
            ))}
          </div>

          <label className="game-check">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              disabled={loading}
            />
            Timed mode (20s per question)
          </label>

          <div className="game-btn-row">
            <button
              type="button"
              className="game-btn game-btn--lg"
              onClick={() => startQuiz(difficulty)}
              disabled={loading}
            >
              {loading ? "Building your quiz…" : "Start quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- results

  if (phase === "done") {
    const diffName = (DIFFICULTIES.find((d) => d.key === difficulty) || {}).name || difficulty;
    return (
      <div className="game-page">
        <h2 className="game-page__title">Quiz complete</h2>
        <div className="game-card game-center">
          <div className="result-score">{score} / {total}</div>
          <div className="result-sub">
            {diffName} difficulty{timed ? " · timed" : ""}
          </div>
          <div>
            <span className="result-best">
              Best on {diffName}: {bestScore === null ? "—" : `${bestScore} / ${total}`}
            </span>
            {isNewBest ? <span className="result-newbest">New best!</span> : null}
          </div>
          <div className="game-btn-row">
            <button type="button" className="game-btn" onClick={() => startQuiz(difficulty)}>
              Play again
            </button>
            <button type="button" className="game-btn game-btn--ghost" onClick={backToStart}>
              Change difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- play

  if (!q) return null;

  const progressPct = Math.round((current / total) * 100);
  const timerPct = Math.max(0, Math.min(100, (msLeft / QUESTION_MS) * 100));
  const secondsLeft = Math.ceil(msLeft / 1000);
  const correct = showAnswer && selected === q.answer;

  const stateClass = (i) => {
    if (showAnswer) {
      if (i === q.answer) return " quiz-option--correct game-opt--correct";
      if (i === selected) return " quiz-option--wrong game-opt--wrong";
      return "";
    }
    return i === selected ? " quiz-option--selected" : "";
  };

  const options = Array.isArray(q.options) ? q.options : [];
  const flavor = q.kind === "flavor" ? splitFlavor(q.prompt) : null;

  return (
    <div className="game-page">
      <div className="quiz-head">
        <span className="quiz-meta">Question {current + 1} / {total}</span>
        <span className="quiz-score">Score: {score}</span>
      </div>

      <div className="quiz-progress-wrap">
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        {timed ? (
          <>
            <div className="quiz-timer">
              <div
                className={`quiz-timer-bar${timerPct <= 25 ? " quiz-timer-bar--low" : ""}`}
                style={{ width: `${showAnswer ? 0 : timerPct}%` }}
              />
            </div>
            <span className="quiz-timer-label">
              {showAnswer ? "Time stopped" : `${secondsLeft}s left`}
            </span>
          </>
        ) : null}
      </div>

      <div className="quiz-card">
        <span className="quiz-kind">{KIND_LABELS[q.kind] || "Question"}</span>

        {/* Media block */}
        {q.kind === "silhouette" && q.image_id != null ? (
          <div className="quiz-stage">
            <img
              src={artworkUrl(q.image_id)}
              onError={artFallback(q.image_id)}
              alt={showAnswer ? "The answer, revealed" : "Mystery Pokémon silhouette"}
              width={220}
              height={220}
              className={`quiz-artwork quiz-silhouette${showAnswer ? " quiz-silhouette--revealed" : ""}`}
            />
          </div>
        ) : null}

        {(q.kind === "type" || q.kind === "generation") && q.image_id != null ? (
          <div className="quiz-stage">
            <img
              src={artworkUrl(q.image_id)}
              onError={artFallback(q.image_id)}
              alt="The Pokémon in question"
              width={180}
              height={180}
              className="quiz-artwork"
            />
          </div>
        ) : null}

        {/* Prompt */}
        {flavor ? (
          <>
            <h3 className="quiz-question">{flavor.lead}</h3>
            <blockquote className="quiz-flavor">{flavor.quote}</blockquote>
          </>
        ) : (
          <h3 className="quiz-question">{q.prompt}</h3>
        )}

        {/* Options */}
        {q.kind === "higher_stat" ? (
          <div className="hs-grid">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className={`hs-card${stateClass(i)}`}
                disabled={showAnswer}
                onClick={() => handleOption(i)}
              >
                {opt.id != null ? (
                  <img
                    src={spriteUrl(opt.id)}
                    alt=""
                    className="hs-card__sprite"
                    width={80}
                    height={80}
                  />
                ) : null}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-options">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className={`quiz-option game-opt${stateClass(i)}`}
                disabled={showAnswer}
                onClick={() => handleOption(i)}
              >
                {q.kind === "flavor" && opt.id != null ? (
                  <img
                    src={spriteUrl(opt.id)}
                    alt=""
                    className="game-opt__sprite"
                    width={32}
                    height={32}
                  />
                ) : null}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="quiz-actions">
          {!showAnswer ? (
            <span className="quiz-meta">Choose one answer</span>
          ) : (
            <span className={`quiz-verdict ${correct ? "quiz-verdict--good" : "quiz-verdict--bad"}`}>
              {correct
                ? "✅ Correct!"
                : timedOut
                ? "⏳ Time's up — the highlight shows the answer."
                : "❌ Not quite — the highlight shows the answer."}
            </span>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!showAnswer}
            className={`game-btn${!showAnswer ? " btn-disabled" : ""}`}
          >
            {current + 1 < total ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
