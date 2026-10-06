const PATHS = {
  laptop: (
    <>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5" />
      <path d="M2 19.5h20" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.1 21h11.8a1.8 1.8 0 0 0 1.5-2.8L14 9.5V3" />
      <path d="M7.4 15h9.2" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 21h18" />
      <path d="M5.5 18V10.5M9.8 18v-7.5M14.2 18v-7.5M18.5 18v-7.5" />
      <path d="M3 18h18" />
      <path d="M2.5 9 12 3.5 21.5 9z" />
    </>
  ),
  graduation: (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
      <path d="M6 11.6v4.4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.4" />
      <path d="M22 9.5v5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" />
      <path d="M5 19 13 11" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 4.8a3.2 3.2 0 0 1 0 6.4" />
      <path d="M18 14.3c1.8.7 3 2.5 3 5.2" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.1 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.1 0 5.2 2.9 4.2 6.2C19.5 15.4 12 20 12 20z" />
      <path d="M4 12h3.5L9 9.5l2.5 5 1.5-2.5h7" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <rect x="5" y="12" width="3" height="5.5" rx=".6" />
      <rect x="10.5" y="8" width="3" height="9.5" rx=".6" />
      <rect x="16" y="4" width="3" height="13.5" rx=".6" />
    </>
  ),
  plusCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  hangUp: (
    <path d="M3.2 14.3c4.9-4.7 12.7-4.7 17.6 0l-2.3 2.5-3.6-1.5v-2.5a11.5 11.5 0 0 0-5.8 0v2.5l-3.6 1.5z" />
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
      <path d="m15.5 10.5 5.5-3v9l-5.5-3" />
    </>
  ),
  videoOff: (
    <>
      <path d="M8 6.5h5.5a2 2 0 0 1 2 2v3M15.5 15.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2" />
      <path d="m15.5 10.5 5.5-3v9l-3-1.6" />
      <path d="M3 3l18 18" />
    </>
  ),
  send: (
    <>
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />,
  replay: (
    <>
      <path d="M4 11a8 8 0 1 1 2.3 5.7" />
      <path d="M4 5v6h6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4.5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a3 3 0 0 0 3 4.2M17 6h2.5a3 3 0 0 1-3 4.2" />
      <path d="M12 13.5V17" />
      <path d="M8.5 20.5h7l-1-3.5h-5z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" />
    </>
  ),
  debate: (
    <>
      <path d="M3.5 5h11v7.5H8l-4.5 3.5z" />
      <path d="M17.5 9h3v8l-3-2.5h-6v-2" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <path d="M12 16.3v.2" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  )
};

function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export default Icon;
