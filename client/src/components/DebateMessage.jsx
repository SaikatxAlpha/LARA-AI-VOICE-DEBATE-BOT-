import { parseLaraResponse } from "../utils/laraResponse";
import { formatTime } from "../utils/format";
import HighlightedText from "./HighlightedText";
import LaraFace from "./LaraFace";
import Icon from "./Icon";

function DebateMessage({ message, active = false, onReplay }) {
  const isLara = message.role === "ai";
  const { counter, challenge } = isLara ? parseLaraResponse(message.text) : {};

  return (
    <article className={`message ${isLara ? "message--lara" : "message--user"} ${active ? "is-active" : ""}`}>
      {isLara ? (
        <LaraFace size="sm" active={active} />
      ) : (
        <span className="user-avatar">
          <Icon name="user" size={18} />
        </span>
      )}

      <div className="message__body">
        <header className="message__meta">
          <strong>{isLara ? "LARA" : "You"}</strong>
          {message.at && <time>{formatTime(message.at)}</time>}
          {onReplay && (
            <button
              type="button"
              className="message__replay"
              onClick={onReplay}
              aria-label="Replay LARA's response"
              title="Replay"
            >
              <Icon name="replay" size={14} />
            </button>
          )}
        </header>

        {isLara ? (
          <>
            <p>
              <HighlightedText text={counter} />
            </p>
            {challenge && (
              <p className="message__challenge">
                <span className="section-label">Challenge</span>
                <span>
                  <HighlightedText text={challenge} />
                </span>
              </p>
            )}
          </>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
    </article>
  );
}

export default DebateMessage;
