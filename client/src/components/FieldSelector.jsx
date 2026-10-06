import { CUSTOM_FIELD_MAX_LENGTH, FIELDS } from "../config/debateOptions";
import Icon from "./Icon";

function FieldSelector({ value, customValue, onChange, onCustomChange, disabled, invalid }) {
  return (
    <>
      <div className={`field-grid ${invalid ? "is-invalid" : ""}`} role="group" aria-label="Debate field">
        {FIELDS.map((field) => (
          <button
            key={field.id}
            type="button"
            className={`field-card ${value === field.id ? "is-selected" : ""}`}
            aria-pressed={value === field.id}
            onClick={() => onChange(field.id)}
            disabled={disabled}
          >
            <Icon name={field.icon} size={22} />
            <span>{field.label}</span>
          </button>
        ))}
      </div>

      {value === "custom" && (
        <input
          className="text-input custom-field-input"
          value={customValue}
          maxLength={CUSTOM_FIELD_MAX_LENGTH}
          placeholder="Name your field, e.g. Philosophy"
          aria-label="Custom field name"
          onChange={(event) => onCustomChange(event.target.value)}
          disabled={disabled}
        />
      )}
    </>
  );
}

export default FieldSelector;
