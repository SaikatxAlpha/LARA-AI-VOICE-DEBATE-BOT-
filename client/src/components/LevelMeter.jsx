const BAR_WEIGHTS = [0.45, 0.75, 1, 0.8, 0.55, 0.9, 0.6];

function LevelMeter({ level, bars = BAR_WEIGHTS.length }) {
  return (
    <span className="level-meter" aria-hidden="true">
      {BAR_WEIGHTS.slice(0, bars).map((weight, index) => (
        <i key={index} style={{ transform: `scaleY(${0.18 + Math.min(1, level * weight * 1.4) * 0.82})` }} />
      ))}
    </span>
  );
}

export default LevelMeter;
