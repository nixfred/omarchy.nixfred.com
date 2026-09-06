import { useEffect, useState } from "preact/hooks";
import { occupiedWorkspaces, setLauncher, setWorkspace, useOS } from "../os/store";
import { themeById } from "../theme/themes";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Battery = {
  level: number;
  addEventListener: (type: string, fn: () => void) => void;
  removeEventListener: (type: string, fn: () => void) => void;
};

function useBattery() {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<Battery> };
    if (!nav.getBattery) return;
    let bat: Battery | null = null;
    let onLevel: (() => void) | null = null;
    nav.getBattery().then((b) => {
      bat = b;
      const sync = () => setPct(Math.round(b.level * 100));
      onLevel = sync;
      sync();
      b.addEventListener("levelchange", sync);
    }).catch(() => {});
    return () => {
      if (bat && onLevel) bat.removeEventListener("levelchange", onLevel);
    };
  }, []);
  return pct;
}

export function Bar() {
  const s = useOS();
  const clock = useClock();
  const bat = useBattery();
  const occ = occupiedWorkspaces();
  const focused = s.windows.find((w) => w.id === s.focused);
  const theme = themeById(s.themeId);

  return (
    <header class={"bar" + (s.stickySuper ? " sticky" : "")}>
      <nav class="workspaces" aria-label="Workspaces">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            class={"ws" + (s.workspace === n ? " on" : "") + (occ.has(n) ? " occ" : "")}
            aria-current={s.workspace === n ? "page" : undefined}
            onClick={() => setWorkspace(n)}
          >
            {n}
          </button>
        ))}
      </nav>
      <button class="wordmark" onClick={() => setLauncher(true)} aria-label="Omarchy menu">
        <img src="/icon.png" alt="" width="18" height="18" />
        omarchy
      </button>
      <div class="bar-right">
        {focused && <span class="bar-title">{focused.title}</span>}
        <span class="bar-chip">{theme.name}</span>
        {bat !== null && <span class="bar-chip"><b>{bat}%</b></span>}
        <time>{clock}</time>
      </div>
    </header>
  );
}
