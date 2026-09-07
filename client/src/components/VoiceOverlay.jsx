import { useEffect, useRef } from "react";

// Full-screen "voice mode" preview, styled after ChatGPT's advanced voice UI —
// a single reactive orb built from animated concentric rings + a bar canvas,
// since browsers don't expose real amplitude data for speechSynthesis audio.
function VoiceOverlay({ open, text, onStop }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const barsRef = useRef(new Array(40).fill(2));

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    size();
    window.addEventListener("resize", size);

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      const n = bars.length;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.27;

      for (let i = 0; i < n; i++) {
        const target = 4 + Math.random() * (radius * 0.55);
        bars[i] += (target - bars[i]) * 0.18;

        const angle = (i / n) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + bars[i]);
        const y2 = cy + Math.sin(angle) * (radius + bars[i]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", size);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="voice-overlay" role="dialog" aria-label="LARA voice mode">
      <div className="voice-overlay__noise" />

      <canvas ref={canvasRef} className="voice-overlay__canvas" />

      <div className="voice-overlay__caption">
        <span className="voice-overlay__tag">LARA · LIVE VOICE</span>
        <p>{text}</p>
      </div>

      <button className="voice-overlay__stop" onClick={onStop} type="button">
        <span className="voice-overlay__stop-icon" />
        End voice
      </button>
    </div>
  );
}

export default VoiceOverlay;