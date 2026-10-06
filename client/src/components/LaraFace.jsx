import { useId } from "react";
import { useDebate } from "../context/DebateContext";
import { LARA } from "../config/lara";

// Small emblem of LARA's built-in figure, used wherever her face appears outside the video.
function LaraEmblem() {
  const id = useId();

  return (
    <svg viewBox="0 0 64 64" className="lara-face__emblem" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="42%" r="70%">
          <stop offset="0" stopColor="#2a1c10" />
          <stop offset="1" stopColor="#0a0806" />
        </radialGradient>
        <radialGradient id={`${id}-head`} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#4a3d32" />
          <stop offset="0.5" stopColor="#251e18" />
          <stop offset="1" stopColor="#0e0b09" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${id}-bg)`} />
      <path
        d="M6 66C7 54 16 49 26 48c3-.5 4-2 4.5-4h3c.5 2 1.5 3.5 4.5 4 10 1 19 6 20 18Z"
        fill="#221b15"
        stroke="rgba(255,186,102,0.45)"
        strokeWidth="0.8"
      />
      <ellipse cx="32" cy="27" rx="11.5" ry="14.5" fill={`url(#${id}-head)`} stroke="rgba(255,186,102,0.6)" strokeWidth="0.8" />
      <ellipse cx="32" cy="29.5" rx="8.6" ry="6.4" fill="rgba(0,0,0,0.5)" />
      <rect x="26.3" y="27.4" width="4.2" height="1.4" rx="0.7" fill="#ffe0b0" />
      <rect x="33.5" y="27.4" width="4.2" height="1.4" rx="0.7" fill="#ffe0b0" />
      <path d="M29 32.6h6" stroke="#ffe0b0" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function LaraFace({ size = "md", active = false }) {
  const { avatar } = useDebate();
  const thumbnail = avatar.profile?.thumbnail;

  return (
    <span
      className={`lara-face lara-face--${size} ${active ? "is-active" : ""}`}
      style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined}
      role="img"
      aria-label={LARA.name}
    >
      {!thumbnail && <LaraEmblem />}
    </span>
  );
}

export default LaraFace;
