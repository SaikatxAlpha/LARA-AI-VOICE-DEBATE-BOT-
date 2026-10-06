import { useDebate } from "../context/DebateContext";
import { pluralize } from "../utils/format";

const NAV_ITEMS = [
  { id: "debate", label: "Debate" },
  { id: "history", label: "History" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "profile", label: "Profile" }
];

const WAVE = [5, 9, 14, 8, 16, 11, 6, 12, 7];

function Navbar({ view, onNavigate }) {
  const { session, profile, history } = useDebate();
  const name = profile.name.trim() || "Guest";

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => onNavigate("debate")}>
        <span className="brand__word">
          LARA
          <svg className="brand__wave" viewBox="0 0 34 18" aria-hidden="true">
            {WAVE.map((height, index) => (
              <rect key={index} x={index * 4} y={(18 - height) / 2} width="1.6" height={height} rx="0.8" />
            ))}
          </svg>
        </span>
        <span className="brand__tag">AI Voice Debate Bot</span>
      </button>

      <nav className="topnav" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`topnav__item ${view === item.id ? "is-active" : ""}`}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
            {item.id === "debate" && session && view !== "debate" && (
              <span className="topnav__live" title="Debate in progress" />
            )}
          </button>
        ))}
      </nav>

      <button type="button" className="user-chip" onClick={() => onNavigate("profile")}>
        <span className="user-chip__avatar">{name.charAt(0).toUpperCase()}</span>
        <span className="user-chip__text">
          <strong>{name}</strong>
          <small>{pluralize(history.length, "debate")}</small>
        </span>
      </button>
    </header>
  );
}

export default Navbar;
