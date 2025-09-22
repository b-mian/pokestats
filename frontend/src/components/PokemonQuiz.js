import { useMemo, useState } from "react";
import questionsData from "../data/quizQuestions.json";
import "./styles/quiz.css";

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PokemonQuiz() {
  const questions = useMemo(() => shuffle(questionsData).slice(0, 10), []);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const q = questions[current];
  const progressPct = Math.round((current / total) * 100);

  function handleOptionClick(index) {
    if (showAnswer) return;
    setSelected(index);
    if (index === q.answer) setScore((s) => s + 1);
    setShowAnswer(true);
  }

  function handleNext() {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      setFinished(true);
    }
  }

  function resetQuiz() {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setFinished(false);
  }

  if (!q || finished) {
    return (
      <div style={{ padding: 12 }}>
        <div className="quiz-card">
          <h2 className="quiz-title">Quiz finished!</h2>
          <p className="quiz-text">
            You scored <strong>{score}</strong> / {total}
          </p>
          <button onClick={resetQuiz} className="menu-btn">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      {/* Progress */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="quiz-meta">Question {current + 1} / {total}</span>
          <span className="quiz-meta">Score: {score}</span>
        </div>
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="quiz-card">
        <h3 className="quiz-question">{q.question}</h3>

        <div className="quiz-options">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isSelected = i === selected;

            let stateClass = "quiz-option";
            if (showAnswer) {
              if (isCorrect) stateClass += " quiz-option--correct";
              else if (isSelected && !isCorrect) stateClass += " quiz-option--wrong";
            } else if (isSelected) {
              stateClass += " quiz-option--selected";
            }

            return (
              <button
                key={i}
                disabled={showAnswer}
                onClick={() => handleOptionClick(i)}
                className={stateClass}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="quiz-actions">
          {!showAnswer ? (
            <span className="quiz-meta">Choose one answer</span>
          ) : (
            <span className="quiz-meta">
              {selected === q.answer ? "✅ Correct!" : "❌ Not quite—highlight shows the answer."}
            </span>
          )}
          <button
            onClick={handleNext}
            disabled={!showAnswer}
            className={`menu-btn ${!showAnswer ? "btn-disabled" : ""}`}
          >
            {current + 1 < total ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}