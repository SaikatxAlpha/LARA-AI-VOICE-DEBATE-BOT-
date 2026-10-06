import { useDebate } from "../context/DebateContext";
import Icon from "./Icon";

const STEPS = ["Topic", "You", "LARA", "Challenge", "Next"];

function DebateProgress() {
  const { session, messages, loading, voice } = useDebate();
  const replies = messages.filter((message) => message.role === "ai");
  const latest = replies[replies.length - 1];
  const speakingLatest =
    latest && voice.id === latest.id && ["pending", "speaking", "paused"].includes(voice.status);

  let active;
  let caption;

  if (!session) {
    active = 0;
    caption = "Choose a field, level and topic to begin.";
  } else if (loading) {
    active = 2;
    caption = "LARA is building her counterargument.";
  } else if (speakingLatest) {
    active = voice.inChallenge ? 3 : 2;
    caption = voice.inChallenge ? "LARA is putting a challenge to you." : "LARA is answering your argument.";
  } else if (!messages.length) {
    active = 1;
    caption = "Make your opening argument.";
  } else {
    active = 4;
    caption = "Your move. Answer LARA's challenge to open the next round.";
  }

  const round = session ? replies.length + (loading || !messages.length ? 1 : 0) : null;

  return (
    <section className="panel progress-panel" aria-label="Debate progress">
      <header className="panel-heading">
        <h2>Debate Progress</h2>
        <span className="progress-panel__round">
          {round ? (
            <>
              Round <strong>{round}</strong> / &infin;
            </>
          ) : (
            "Not started"
          )}
        </span>
      </header>

      <ol className="progress-steps" style={{ "--progress": active / (STEPS.length - 1) }}>
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={index < active ? "is-done" : index === active ? "is-active" : ""}
            aria-current={index === active ? "step" : undefined}
          >
            <span className="progress-steps__node">
              {index < active && <Icon name="check" size={13} />}
            </span>
            <span className="progress-steps__label">{label}</span>
          </li>
        ))}
      </ol>

      <p className="progress-panel__caption">{caption}</p>

      {session && (
        <p className="progress-panel__motion">
          <span className="section-label">Motion</span>
          {session.topic}
        </p>
      )}
    </section>
  );
}

export default DebateProgress;
