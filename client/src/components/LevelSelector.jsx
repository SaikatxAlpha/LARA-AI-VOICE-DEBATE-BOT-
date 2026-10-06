import { LEVELS } from "../config/debateOptions";
import LevelBars from "./LevelBars";

function LevelSelector({ value, onChange, disabled, invalid }) {
  return (
    <div className={`level-list ${invalid ? "is-invalid" : ""}`} role="group" aria-label="Debate level">
      {LEVELS.map((level) => (
        <button
          key={level.id}
          type="button"
          className={`level-option ${value === level.id ? "is-selected" : ""}`}
          aria-pressed={value === level.id}
          onClick={() => onChange(level.id)}
          disabled={disabled}
        >
          <LevelBars value={level.bars} />
          <span className="level-option__text">
            <strong>{level.label}</strong>
            <small>{level.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export default LevelSelector;
