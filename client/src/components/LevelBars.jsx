function LevelBars({ value }) {
  return (
    <span className="level-bars" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <i key={bar} className={bar <= value ? "is-on" : ""} />
      ))}
    </span>
  );
}

export default LevelBars;
