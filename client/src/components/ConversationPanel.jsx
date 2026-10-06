import { useEffect, useRef } from "react";
import { useDebate } from "../context/DebateContext";
import { groupByRound } from "../utils/debateStats";
import { pluralize } from "../utils/format";
import DebateMessage from "./DebateMessage";
import EmptyState from "./EmptyState";
import LaraFace from "./LaraFace";
import Icon from "./Icon";

function ConversationPanel({ expanded, onToggle }) {
  const { session, messages, loading, pendingArgument, voice, speakMessage } = useDebate();
  const listRef = useRef(null);
  const rounds = groupByRound(messages);
  const isPlaying = voice.status === "speaking" || voice.status === "paused";

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, loading]);

  return (
    <section
      className={`panel conversation-panel ${expanded ? "is-expanded" : ""}`}
      aria-label="Conversation"
    >
      <header className="panel-heading">
        <h2>Conversation</h2>
        {rounds.length > 0 && (
          <span className="panel-heading__meta">{pluralize(rounds.length, "round")}</span>
        )}
        <button
          type="button"
          className="panel-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide conversation" : "Show conversation"}
        >
          <Icon name="chevronDown" size={18} />
        </button>
      </header>

      <div className="conversation-list" ref={listRef}>
        {rounds.length === 0 && !loading && (
          <EmptyState icon="debate" title={session ? "No rounds yet" : "No debate in progress"}>
            {session
              ? "Speak or type your opening argument. Every round you and LARA argue will appear here."
              : "Once you start a debate, every round between you and LARA is recorded here."}
          </EmptyState>
        )}

        {rounds.map(({ round, messages: roundMessages }) => (
          <div className="round-group" key={round}>
            <div className="round-divider">
              <span>Round {round}</span>
            </div>
            {roundMessages.map((message) => (
              <DebateMessage
                key={message.id}
                message={message}
                active={isPlaying && voice.id === message.id}
                onReplay={message.role === "ai" ? () => speakMessage(message) : undefined}
              />
            ))}
          </div>
        ))}

        {loading && (
          <div className="round-group">
            <div className="round-divider">
              <span>Round {rounds.length + 1}</span>
            </div>
            <DebateMessage message={{ id: "pending", role: "user", text: pendingArgument, at: null }} />
            <div className="message message--lara is-typing">
              <LaraFace size="sm" />
              <span className="thinking-dots" aria-label="LARA is thinking">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ConversationPanel;
