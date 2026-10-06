import { useEffect, useRef, useState } from "react";
import { useStreamLevel } from "../hooks/useAudioLevel";

const BAR_COUNT = 56;
const STEP_MS = 90;
const SILENCE = Array(BAR_COUNT).fill(0);

// Rolling waveform of LARA's measured audio while she speaks. Remount it (via `key`)
// to start a fresh trace for a new response.
function VoiceWaveform({ stream, recording }) {
  const level = useStreamLevel(recording ? stream : null);
  const levelRef = useRef(0);
  const [history, setHistory] = useState(SILENCE);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setHistory((current) => [...current.slice(1), levelRef.current]);
    }, STEP_MS);

    return () => window.clearInterval(timer);
  }, [recording]);

  return (
    <div className={`waveform ${recording ? "is-live" : ""}`} aria-hidden="true">
      {history.map((value, index) => (
        <i key={index} style={{ "--h": Math.max(0.08, Math.min(1, value * 1.3)) }} />
      ))}
    </div>
  );
}

export default VoiceWaveform;
