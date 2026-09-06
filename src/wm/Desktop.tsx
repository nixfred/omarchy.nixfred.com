import { useEffect, useRef, useState } from "preact/hooks";
import { ensureSession, rememberRects, setPhase, useOS } from "../os/store";
import { layout } from "./dwindle";
import { WindowView } from "./Window";
import { Bar } from "../shell/Bar";
import { Launcher } from "../shell/Launcher";
import { Cheatsheet } from "../shell/Cheatsheet";
import { Toasts } from "../shell/Toasts";
import { THEMES, themeById } from "../theme/themes";
import type { Rect } from "../os/types";

export function Desktop() {
  const s = useOS();
  const area = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const theme = themeById(s.themeId);

  useEffect(() => {
    ensureSession();
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const idle = Number(new URLSearchParams(location.search).get("idle") ?? 120000);
    const lock = Number(new URLSearchParams(location.search).get("lock") ?? 300000);
    let saverT = 0;
    let lockT = 0;
    const arm = () => {
      window.clearTimeout(saverT);
      window.clearTimeout(lockT);
      if (s.phase !== "desktop") return;
      saverT = window.setTimeout(() => setPhase("screensaver"), idle);
      lockT = window.setTimeout(() => setPhase("lock"), lock);
    };
    arm();
    const ev = ["mousemove", "keydown", "mousedown", "pointerdown"];
    ev.forEach((e) => window.addEventListener(e, arm));
    return () => {
      window.clearTimeout(saverT);
      window.clearTimeout(lockT);
      ev.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [s.phase]);

  const tree = s.trees[s.workspace] ?? { kind: "empty" as const };
  const gap = s.gaps ? 5 : 0;
  const outer: Rect = { x: 0, y: 0, w: size.w, h: size.h };
  const padded = { x: gap, y: gap, w: Math.max(40, size.w - gap * 2), h: Math.max(40, size.h - gap * 2) };
  const tiled = layout(tree, padded, gap);
  rememberRects(tiled);

  const wins = s.windows.filter((w) => w.workspace === s.workspace);

  return (
    <div class={"desktop" + (s.barHidden ? " no-bar" : "") + (s.gaps ? "" : " no-gaps")}>
      <div class="wallpaper-stack" aria-hidden="true">
        {THEMES.map((t) => (
          <div
            key={t.id}
            class={"wallpaper" + (t.id === theme.id ? " on" : "")}
            style={{ backgroundImage: `url(${t.wallpaper})` }}
          />
        ))}
        <div class="wallpaper-scrim" />
      </div>
      <Bar />
      <div class="workspace" ref={area}>
        {wins.map((w) => {
          const rect = w.fullscreen
            ? outer
            : w.floating
              ? w.float
              : tiled[w.id] ?? { x: 40, y: 40, w: 480, h: 320 };
          return <WindowView key={w.id} win={w} rect={rect} focused={s.focused === w.id} />;
        })}
      </div>
      <Toasts />
      {s.launcher && <Launcher />}
      {s.cheatsheet && <Cheatsheet />}
    </div>
  );
}
