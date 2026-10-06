import { useDebate } from "../context/DebateContext";
import { getLevel } from "../config/debateOptions";
import { LARA } from "../config/lara";
import { computeStats } from "../utils/debateStats";
import Icon from "../components/Icon";
import LaraFigure from "../components/LaraFigure";

const PREVIEW_LINE = "Hi, I'm LARA. Pick a side, and I'll argue the other one.";

function Profile() {
  const { profile, setProfile, history, speech, mic, avatar } = useDebate();
  const stats = computeStats(history);
  const name = profile.name.trim() || "Guest";
  const previewing = speech.playback.id === "preview" && speech.playback.status === "speaking";
  const liveVideo = avatar.availability.status === "available";

  const tiles = [
    { label: "Debates finished", value: stats.debates },
    { label: "Rounds argued", value: stats.rounds },
    { label: "Favourite field", value: stats.favoriteField || "—" },
    { label: "Preferred level", value: getLevel(stats.preferredLevel)?.label || "—" }
  ];

  return (
    <main className="page">
      <header className="page__header">
        <h1>Profile</h1>
        <p>Your name, your record and how LARA sounds. Everything here stays on this device.</p>
      </header>

      <div className="profile-grid">
        <section className="panel profile-card" aria-label="Your profile">
          <div className="profile-card__identity">
            <span className="user-chip__avatar user-chip__avatar--large">{name.charAt(0).toUpperCase()}</span>
            <label className="form-field">
              <span>Display name</span>
              <input
                className="text-input"
                value={profile.name}
                maxLength={32}
                placeholder="Guest"
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>
          </div>

          <dl className="stat-tiles">
            {tiles.map((tile) => (
              <div key={tile.label} className="stat-tile">
                <dt>{tile.label}</dt>
                <dd>{tile.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel settings-card" aria-label="Voice settings">
          <header className="panel-heading">
            <h2>LARA&apos;s voice</h2>
          </header>

          <p className="settings-card__note">
            {liveVideo
              ? "With streaming video LARA speaks with her avatar's own voice. This browser voice is used only if the stream is unavailable."
              : "LARA's built-in figure speaks with this browser voice, and her mouth follows each spoken word."}
          </p>

          <label className="form-field">
            <span>Voice</span>
            <select
              className="text-input"
              value={speech.voice?.name || ""}
              onChange={(event) => speech.setVoiceName(event.target.value)}
              disabled={!speech.voices.length}
            >
              {speech.voices.length === 0 && <option value="">Default browser voice</option>}
              {speech.voices.map((voice) => (
                <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <div className="settings-card__actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => (previewing ? speech.stop() : speech.speak(PREVIEW_LINE, { id: "preview" }))}
              disabled={!speech.supported || speech.muted}
            >
              <Icon name={previewing ? "pause" : "play"} size={16} />
              {previewing ? "Stop preview" : "Preview voice"}
            </button>

            <button
              type="button"
              className={`ghost-button ${speech.muted ? "is-on" : ""}`}
              onClick={() => speech.setMuted(!speech.muted)}
              aria-pressed={speech.muted}
            >
              <Icon name={speech.muted ? "volumeOff" : "volume"} size={16} />
              {speech.muted ? "LARA is muted" : "Mute LARA"}
            </button>
          </div>

          <ul className="capability-list">
            <li className={speech.supported ? "is-ok" : ""}>
              <Icon name={speech.supported ? "check" : "alert"} size={15} />
              Spoken responses {speech.supported ? "available" : "unavailable in this browser"}
            </li>
            <li className={mic.supported ? "is-ok" : ""}>
              <Icon name={mic.supported ? "check" : "alert"} size={15} />
              Voice input {mic.supported ? "available" : "unavailable in this browser"}
            </li>
            <li className="is-ok">
              <Icon name="check" size={15} />
              {liveVideo ? "Streaming talking avatar connected through D-ID" : "Built-in real-time LARA figure"}
            </li>
          </ul>
        </section>

        <section className="panel lara-card" aria-label="About LARA">
          <div className="lara-card__figure">
            <LaraFigure presence="idle" />
          </div>
          <div className="lara-card__body">
            <span className="eyebrow">{LARA.role}</span>
            <h2>{LARA.name}</h2>
            <p>
              LARA takes the opposing side of any topic you choose, answers each argument with a
              counterargument, and closes every round with a challenge for you to answer.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
