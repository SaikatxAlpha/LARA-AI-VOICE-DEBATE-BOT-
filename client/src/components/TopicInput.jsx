import { TOPIC_MAX_LENGTH } from "../config/debateOptions";

function TopicInput({ value, onChange, onSubmit, disabled, invalid }) {
  return (
    <div className={`topic-input ${invalid ? "is-invalid" : ""}`}>
      <textarea
        value={value}
        maxLength={TOPIC_MAX_LENGTH}
        rows={3}
        placeholder="e.g. Should AI replace software engineers?"
        aria-label="Debate topic"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <span className="topic-input__count">
        {value.length}/{TOPIC_MAX_LENGTH}
      </span>
    </div>
  );
}

export default TopicInput;
