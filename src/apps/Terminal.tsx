import { useEffect, useRef } from "preact/hooks";
import { launch, patchApp } from "../os/store";
import { getCwd, list, readFile, resolve } from "../fs/vfs";
import { runCommand, type Line } from "./commands";
import type { Win } from "../os/types";

type TermState = {
  cwd: string;
  lines: { text: string; kind?: Line["kind"] }[];
  input: string;
  history: string[];
  histIdx: number;
};

const WELCOME: Line[] = [
  { text: "Omarchy 4.0.2 — Hyprland session in your browser", kind: "accent" },
  { text: "Super is Alt. Super+Space launcher · Super+K keys · help in this shell.", kind: "muted" },
  { text: "" },
];

export function Terminal({ win, focused }: { win: Win; focused: boolean }) {
  const st = win.app as unknown as TermState;
  const cwd = st.cwd || "/home/pi";
  const lines = st.lines.length ? st.lines : WELCOME;
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight);
  }, [lines.length]);

  useEffect(() => {
    if (focused) input.current?.focus();
  }, [focused]);

  const run = (raw: string) => {
    const typed = raw;
    const history = typed.trim() ? [...st.history, typed] : st.history;
    const promptLine: Line = { text: `pi@omarchy:${pretty(cwd)}$ ${typed}`, kind: "cmd" };
    const res = runCommand(typed, cwd);
    const nextCwd = res.cwd ?? getCwd();
    const nextLines = typed.trim() === "clear" ? [] : [...lines, promptLine, ...res.lines];
    patchApp(win.id, { cwd: nextCwd, lines: nextLines, input: "", history, histIdx: -1 });
    if (res.open) {
      if (res.open.app === "editor") {
        const path = res.open.path ?? "/home/pi/README.md";
        const content = readFile(path) ?? "";
        launch("editor", { app: { path, content, dirty: false }, title: path.split("/").pop() });
      } else if (res.open.app === "browser") {
        const url = res.open.url ?? "https://omarchy.org";
        launch("browser", { app: { url, input: url } });
      } else if (res.open.app === "files") {
        launch("files", { app: { path: res.open.path ?? nextCwd } });
      } else {
        launch(res.open.app);
      }
    }
  };

  return (
    <div class="term" onMouseDown={() => input.current?.focus()}>
      <div class="term-log" ref={log}>
        {lines.map((ln, i) => (
          <div key={i} class={ln.kind ?? "plain"}>{ln.text}</div>
        ))}
      </div>
      <div class="term-line">
        <span class="ps1">pi@omarchy:{pretty(cwd)}$</span>
        <input
          ref={input}
          value={st.input}
          spellcheck={false}
          autocomplete="off"
          aria-label="Terminal input"
          onInput={(e) => patchApp(win.id, { input: (e.target as HTMLInputElement).value, histIdx: -1 })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run(st.input);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const h = st.history;
              if (!h.length) return;
              const idx = st.histIdx < 0 ? h.length - 1 : Math.max(0, st.histIdx - 1);
              patchApp(win.id, { histIdx: idx, input: h[idx] });
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const h = st.history;
              if (st.histIdx < 0) return;
              const idx = st.histIdx + 1;
              if (idx >= h.length) patchApp(win.id, { histIdx: -1, input: "" });
              else patchApp(win.id, { histIdx: idx, input: h[idx] });
            } else if (e.key === "c" && e.ctrlKey) {
              e.preventDefault();
              patchApp(win.id, { input: "" });
            } else if (e.key === "l" && e.ctrlKey) {
              e.preventDefault();
              patchApp(win.id, { lines: [], input: "" });
            } else if (e.key === "Tab") {
              e.preventDefault();
              const cur = st.input;
              const parts = cur.split(/\s+/);
              const last = parts[parts.length - 1] ?? "";
              const dir = resolve(last.includes("/") ? last.replace(/\/[^/]*$/, "") || "/" : cwd, cwd);
              const prefix = last.split("/").pop() ?? "";
              const kids = list(dir) ?? [];
              const match = kids.filter((k) => k.name.startsWith(prefix));
              if (match.length === 1) {
                const name = match[0]!.name + (match[0]!.type === "dir" ? "/" : "");
                parts[parts.length - 1] = last.includes("/") ? last.replace(/[^/]+$/, name) : name;
                patchApp(win.id, { input: parts.join(" ") });
              }
            }
          }}
        />
      </div>
    </div>
  );
}

function pretty(cwd: string) {
  return cwd === "/home/pi" ? "~" : cwd.replace(/^\/home\/pi/, "~");
}
