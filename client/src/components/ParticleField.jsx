import { useEffect, useRef } from "react";

// Monochrome interactive particle network.
// Dots drift, link up when close, and get pushed away from the cursor.
function ParticleField({ active }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    mouse: { x: -9999, y: -9999 },
    raf: null
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const state = stateRef.current;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(120, Math.floor((width * height) / 14000));
      state.particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      }));
    }

    function onMove(e) {
      const t = e.touches ? e.touches[0] : e;
      state.mouse.x = t.clientX;
      state.mouse.y = t.clientY;
    }

    function onLeave() {
      state.mouse.x = -9999;
      state.mouse.y = -9999;
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      const pts = state.particles;
      const linkDist = 130;
      const mouseDist = 160;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        const dxm = p.x - state.mouse.x;
        const dym = p.y - state.mouse.y;
        const dm = Math.hypot(dxm, dym);

        if (dm < mouseDist) {
          const force = (mouseDist - dm) / mouseDist;
          p.x += (dxm / (dm || 1)) * force * 1.6;
          p.y += (dym / (dm || 1)) * force * 1.6;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(224,182,84,0.55)";
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(224,182,84,${0.14 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      state.raf = requestAnimationFrame(tick);
    }

    resize();
    tick();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-field ${active ? "" : "particle-field--dim"}`}
      aria-hidden="true"
    />
  );
}

export default ParticleField;