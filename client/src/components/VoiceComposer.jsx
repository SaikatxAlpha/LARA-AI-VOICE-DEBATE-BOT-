import { useEffect, useLayoutEffect, useRef } from "react";
import { useDebate } from "../context/DebateContext";
import VoiceRecorder from "./VoiceRecorder";
import Icon from "./Icon";

function VoiceComposer() {
  const { session, draft, setDraft, loading, submitArgument, mic } = useDebate();
  const textareaRef = useRef(null);
  const sessionId = session?.id;

  useEffect(() => {
    if (sessionId && window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current.focus();
    }
  }, [sessionId]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [draft]);

  let placeholder = "Start a debate to respond";

  if (session) {
    placeholder = mic.listening ? "Listening..." : "Click the mic and speak, or type...";
  }

  let note = session ? "Enter to send · Shift + Enter for a new line" : "";
  let noteTone = "";

  if (mic.error) {
    note = mic.error;
    noteTone = "is-error";
  } else if (!mic.supported) {
    note = "Voice input isn't available in this browser. Type your argument instead.";
  }

  return (
    <form
      className={`composer ${mic.listening ? "is-listening" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        submitArgument();
      }}
    >
      <div className="composer__box">
        <VoiceRecorder />

        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          placeholder={placeholder}
          disabled={!session}
          aria-label="Your argument"
          onChange={(event) => {
            setDraft(event.target.value);
            mic.clearError();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitArgument();
            }
          }}
        />

        <button
          type="submit"
          className="composer__send"
          disabled={!session || loading || !draft.trim()}
          aria-label="Send argument"
        >
          <Icon name="send" size={20} />
        </button>
      </div>

      {mic.listening && mic.interim ? (
        <p className="composer__interim">{mic.interim}</p>
      ) : (
        note && <p className={`composer__note ${noteTone}`}>{note}</p>
      )}
    </form>
  );
}

export default VoiceComposer;
