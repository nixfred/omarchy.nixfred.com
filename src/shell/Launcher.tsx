import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { APP_LIST, findApps } from "../apps/registry";
import { launch, reboot, setCheatsheet, setLauncher, setPhase, setTheme } from "../os/store";
import { THEMES } from "../theme/themes";
import type { AppId } from "../os/types";

type Item = { kind: "app" | "cmd"; id: string; title: string; sub: string; run: () => void };

export function Launcher() {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const items = useMemo<Item[]>(() => {
    const apps = findApps(q).map((a) => ({
      kind: "app" as const,
      id: a.id,
      title: a.name,
      sub: a.hint || a.bin,
      run: () => launch(a.id as AppId),
    }));
    const cmds: Item[] = [
      ...THEMES.map((t) => ({
        kind: "cmd" as const,
        id: "theme-" + t.id,
        title: "Theme · " + t.name,
        sub: t.id,
        run: () => {
          setTheme(t.id);
          setLauncher(false);
        },
      })),
      { kind: "cmd", id: "lock", title: "Lock", sub: "SUPER + CTRL + L", run: () => setPhase("lock") },
      { kind: "cmd", id: "saver", title: "Screensaver", sub: "idle", run: () => setPhase("screensaver") },
      { kind: "cmd", id: "keys", title: "Keybindings", sub: "SUPER + K", run: () => { setLauncher(false); setCheatsheet(true); } },
      { kind: "cmd", id: "reboot", title: "Reboot", sub: "plymouth", run: () => reboot() },
    ];
    const s = q.trim().toLowerCase();
    const extra = s
      ? cmds.filter((c) => `${c.title} ${c.sub}`.toLowerCase().includes(s))
      : cmds.filter((c) => ["lock", "keys", "reboot"].includes(c.id));
    return [...apps, ...extra];
  }, [q]);

  useEffect(() => {
    setI(0);
  }, [q]);

  const go = (item?: Item) => {
    (item ?? items[i])?.run();
  };

  return (
    <div class="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLauncher(false); }}>
      <div class="palette" role="dialog" aria-label="Omarchy menu">
        <input
          ref={input}
          value={q}
          placeholder="Search apps, themes, commands…"
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((n) => Math.min(items.length - 1, n + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((n) => Math.max(0, n - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go();
            }
          }}
        />
        <ul>
          {items.length === 0 && <li><button disabled>no matches</button></li>}
          {items.map((item, idx) => (
            <li key={item.id}>
              <button class={idx === i ? "on" : ""} onMouseEnter={() => setI(idx)} onClick={() => go(item)}>
                <span>{item.title}</span>
                <small>{item.sub}</small>
              </button>
            </li>
          ))}
        </ul>
        <footer>
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>enter</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span>{APP_LIST.length} apps</span>
        </footer>
      </div>
    </div>
  );
}
