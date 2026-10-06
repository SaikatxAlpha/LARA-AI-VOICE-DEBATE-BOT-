const COPY = {
  speaking: "LARA is speaking...",
  thinking: "LARA is thinking...",
  listening: "Listening..."
};

function SpeakingIndicator({ presence, inSession }) {
  const label = COPY[presence] || (inSession ? "Waiting for your argument" : "LARA is ready");

  return (
    <div className={`presence-pill is-${presence}`} role="status" aria-live="polite">
      <span className="presence-pill__dot" />
      {label}
    </div>
  );
}

export default SpeakingIndicator;
