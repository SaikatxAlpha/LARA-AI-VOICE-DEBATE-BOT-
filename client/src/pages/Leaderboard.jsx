import { useDebate } from "../context/DebateContext";
import { getLevel } from "../config/debateOptions";
import { countRounds, rankDebates, totalsByField } from "../utils/debateStats";
import { formatDate, pluralize } from "../utils/format";
import EmptyState from "../components/EmptyState";
import LevelBars from "../components/LevelBars";

function Leaderboard({ onNavigate }) {
  const { history } = useDebate();
  const ranked = rankDebates(history).slice(0, 10);
  const fields = totalsByField(history);
  const maxRounds = Math.max(1, ...fields.map((field) => field.rounds));

  return (
    <main className="page">
      <header className="page__header">
        <h1>Leaderboard</h1>
        <p>Your longest stands against LARA on this device, ranked by rounds sustained, then by level.</p>
      </header>

      {ranked.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="trophy"
            title="No records yet"
            action={
              <button type="button" className="ghost-button" onClick={() => onNavigate("debate")}>
                Start a debate
              </button>
            }
          >
            Finish a debate and it will be ranked here by how many rounds you held your ground.
          </EmptyState>
        </div>
      ) : (
        <div className="leaderboard-layout">
          <section className="panel" aria-label="Top debates">
            <header className="panel-heading">
              <h2>Top debates</h2>
            </header>
            <ol className="rank-list">
              {ranked.map((entry, index) => {
                const level = getLevel(entry.level);

                return (
                  <li key={entry.id} className={`rank-row ${index === 0 ? "is-first" : ""}`}>
                    <span className="rank-row__position">{index + 1}</span>
                    <span className="rank-row__topic">
                      <strong>{entry.topic}</strong>
                      <small>
                        {entry.fieldLabel} · {formatDate(entry.endedAt)}
                      </small>
                    </span>
                    <span className="rank-row__level">
                      <LevelBars value={level?.bars || 0} />
                      {level?.label}
                    </span>
                    <span className="rank-row__score">{pluralize(countRounds(entry), "round")}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="panel" aria-label="Rounds by field">
            <header className="panel-heading">
              <h2>By field</h2>
            </header>
            <ul className="field-totals">
              {fields.map((field) => (
                <li key={field.field}>
                  <span className="field-totals__label">
                    <strong>{field.field}</strong>
                    <small>
                      {pluralize(field.debates, "debate")} · {pluralize(field.rounds, "round")}
                    </small>
                  </span>
                  <span className="field-totals__bar">
                    <i style={{ width: `${(field.rounds / maxRounds) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}

export default Leaderboard;
