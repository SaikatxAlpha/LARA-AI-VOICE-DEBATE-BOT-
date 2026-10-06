import { useState } from "react";
import { useDebate } from "../context/DebateContext";
import { getLevel } from "../config/debateOptions";
import { countRounds, groupByRound } from "../utils/debateStats";
import { formatDate, formatTime, pluralize } from "../utils/format";
import DebateMessage from "../components/DebateMessage";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";

function History({ onNavigate }) {
  const { history, deleteHistoryEntry, speakMessage } = useDebate();
  const [selectedId, setSelectedId] = useState(null);
  const selected = history.find((entry) => entry.id === selectedId) || history[0] || null;

  return (
    <main className="page">
      <header className="page__header">
        <h1>History</h1>
        <p>Every debate you finish is saved on this device, with the full transcript.</p>
      </header>

      {selected ? (
        <div className="history-layout">
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`panel history-item ${entry.id === selected.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(entry.id)}
                  aria-pressed={entry.id === selected.id}
                >
                  <span className="history-item__topic">{entry.topic}</span>
                  <span className="history-item__meta">
                    {entry.fieldLabel} · {getLevel(entry.level)?.label} ·{" "}
                    {pluralize(countRounds(entry), "round")}
                  </span>
                  <time>{formatDate(entry.endedAt)}</time>
                </button>
              </li>
            ))}
          </ul>

          <section className="panel history-detail" aria-label="Debate transcript">
            <header className="history-detail__head">
              <div>
                <span className="eyebrow">
                  {selected.fieldLabel} · {getLevel(selected.level)?.label}
                </span>
                <h2>{selected.topic}</h2>
                <p>
                  {formatDate(selected.startedAt)} at {formatTime(selected.startedAt)} ·{" "}
                  {pluralize(countRounds(selected), "round")}
                </p>
              </div>
              <button
                type="button"
                className="ghost-button ghost-button--danger"
                onClick={() => {
                  deleteHistoryEntry(selected.id);
                  setSelectedId(null);
                }}
              >
                <Icon name="trash" size={16} />
                Delete
              </button>
            </header>

            <div className="history-detail__transcript">
              {groupByRound(selected.messages).map(({ round, messages }) => (
                <div className="round-group" key={round}>
                  <div className="round-divider">
                    <span>Round {round}</span>
                  </div>
                  {messages.map((message) => (
                    <DebateMessage
                      key={message.id}
                      message={message}
                      onReplay={message.role === "ai" ? () => speakMessage(message) : undefined}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            icon="clock"
            title="No debates yet"
            action={
              <button type="button" className="ghost-button" onClick={() => onNavigate("debate")}>
                Start a debate
              </button>
            }
          >
            When you end a debate with LARA, its full transcript is saved here.
          </EmptyState>
        </div>
      )}
    </main>
  );
}

export default History;
