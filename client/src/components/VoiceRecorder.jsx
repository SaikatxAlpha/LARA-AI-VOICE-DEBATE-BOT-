import { useDebate } from "../context/DebateContext";
import Icon from "./Icon";

function VoiceRecorder() {
  const { session, mic, toggleListening } = useDebate();

  const label = !mic.supported
    ? "Voice input unavailable in this browser"
    : mic.listening
      ? "Stop listening"
      : "Speak your argument";

  return (
    <button
      type="button"
      className={`mic-button ${mic.listening ? "is-listening" : ""}`}
      onClick={toggleListening}
      disabled={!session || !mic.supported}
      aria-pressed={mic.listening}
      aria-label={label}
      title={label}
    >
      <Icon name="mic" size={20} />
    </button>
  );
}

export default VoiceRecorder;
