import { useEffect, useRef } from "react";
import { createLaraFigure } from "../avatar/figure/createLaraFigure";

// LARA's built-in, real-time rendered figure. `spokenText` and `charIndex` come from the speech
// engine's word boundaries, so each spoken word moves the mouth as it is heard.
function LaraFigure({ presence, micLevel = 0, paused = false, spokenText = "", charIndex = 0 }) {
  const canvasRef = useRef(null);
  const figureRef = useRef(null);

  useEffect(() => {
    const figure = createLaraFigure(canvasRef.current);
    figureRef.current = figure;

    return () => {
      figure.destroy();
      figureRef.current = null;
    };
  }, []);

  useEffect(() => {
    figureRef.current?.setInput({ presence, micLevel, paused });
  }, [presence, micLevel, paused]);

  useEffect(() => {
    if (presence !== "speaking" || !spokenText) {
      return;
    }

    const word = spokenText.slice(charIndex).match(/^\S+/)?.[0];

    if (word) {
      figureRef.current?.pulse(word);
    }
  }, [presence, spokenText, charIndex]);

  return <canvas ref={canvasRef} className="lara-figure" role="img" aria-label="LARA, your AI debate partner" />;
}

export default LaraFigure;
