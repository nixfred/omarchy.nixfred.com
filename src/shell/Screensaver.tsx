import { useEffect, useRef } from "preact/hooks";
import { setPhase, useOS } from "../os/store";
import { themeById } from "../theme/themes";
import { LOGO } from "../fs/vfs";

type Cell = { ch: string; col: number; row: number };

export function Screensaver() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { themeId } = useOS();

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const theme = themeById(themeId);
    const lines = LOGO.split("\n");
    const cells: Cell[] = [];
    lines.forEach((line, row) => {
      [...line].forEach((ch, col) => {
        if (ch !== " ") cells.push({ ch, col, row });
      });
    });
    const cols = Math.max(...lines.map((l) => l.length));
    const rows = lines.length;
    const glyphs = "█▓▒░▄▀#%$@01ABCDef";
    let raf = 0;
    let t0 = performance.now();
    const delays = cells.map(() => 300 + Math.random() * 2200);

    const resize = () => {
      c.width = window.innerWidth * devicePixelRatio;
      c.height = window.innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      const t = now - t0;
      const W = c.width;
      const H = c.height;
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);
      const cw = Math.min(W / (cols + 8), H / (rows + 8) / 1.7);
      const ch = cw * 1.7;
      const ox = (W - cols * cw) / 2;
      const oy = (H - rows * ch) / 2;
      g.font = `${ch}px "JetBrains Mono", monospace`;
      g.textBaseline = "top";
      cells.forEach((cell, i) => {
        const d = delays[i]!;
        let chs = cell.ch;
        let color = theme.accent;
        if (t < d) {
          chs = glyphs[Math.floor(Math.random() * glyphs.length)]!;
          color = theme.green;
        } else if (t < d + 400) {
          color = theme.green;
        } else {
          color = cell.col / cols < 0.5 ? theme.accent : theme.bright;
        }
        g.fillStyle = color;
        g.fillText(chs, ox + cell.col * cw, oy + cell.row * ch);
      });
      if (t > 9000) t0 = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const exit = () => setPhase("desktop");
    window.addEventListener("keydown", exit, true);
    window.addEventListener("mousedown", exit, true);
    window.addEventListener("mousemove", exit, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", exit, true);
      window.removeEventListener("mousedown", exit, true);
      window.removeEventListener("mousemove", exit, true);
    };
  }, [themeId]);

  return (
    <div class="saver" role="dialog" aria-label="Screensaver">
      <canvas ref={canvas} />
    </div>
  );
}
