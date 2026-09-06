import { useEffect, useState } from "preact/hooks";
import { DEFAULT_THEME_ID, themeById, THEMES } from "../theme/themes";
import type { AppId, Notice, OsState, Rect, Tree, Win } from "./types";
import * as dw from "../wm/dwindle";
import { readFile, writeFile } from "../fs/vfs";

const KEY = "omarchy.os.v1";
let seq = 1;
const listeners = new Set<() => void>();

const APPS: Record<AppId, { title: string }> = {
  terminal: { title: "Terminal" },
  browser: { title: "Browser" },
  files: { title: "Files" },
  editor: { title: "Editor" },
  settings: { title: "Settings" },
  btop: { title: "btop" },
  about: { title: "About" },
};

function initialApp(appId: AppId): Record<string, unknown> {
  switch (appId) {
    case "terminal":
      return { cwd: "/home/pi", lines: [] as string[], input: "", history: [] as string[], histIdx: -1 };
    case "browser":
      return { url: "omarchy://start", input: "omarchy://start" };
    case "files":
      return { path: "/home/pi" };
    case "editor":
      return { path: "/home/pi/README.md", content: readFile("/home/pi/README.md") ?? "", dirty: false };
    case "settings":
      return { tab: "appearance" };
    default:
      return {};
  }
}

function fresh(): OsState {
  return {
    phase: "boot",
    themeId: DEFAULT_THEME_ID,
    workspace: 1,
    windows: [],
    trees: {},
    focused: null,
    launcher: false,
    cheatsheet: false,
    notices: [],
    stickySuper: false,
    gaps: true,
    barHidden: false,
    fsEpoch: 1,
  };
}

function load(): OsState {
  const s = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<OsState>;
      if (typeof saved.themeId === "string" && THEMES.some((t) => t.id === saved.themeId)) s.themeId = saved.themeId;
      if (typeof saved.gaps === "boolean") s.gaps = saved.gaps;
      if (typeof saved.barHidden === "boolean") s.barHidden = saved.barHidden;
    }
  } catch {
    /* private mode */
  }
  const params = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
  const qTheme = params.get("theme");
  if (qTheme && THEMES.some((t) => t.id === qTheme)) s.themeId = qTheme;
  if (params.get("boot") === "1") s.phase = "boot";
  else if (params.has("noboot") || sessionStorage.getItem("omarchy.booted") === "1") s.phase = "desktop";
  return s;
}

let state: OsState = load();

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ themeId: state.themeId, gaps: state.gaps, barHidden: state.barHidden }),
    );
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  applyTheme(state.themeId);
  listeners.forEach((l) => l());
}

export function get(): OsState {
  return state;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useOS(): OsState {
  const [, set] = useState(0);
  useEffect(() => subscribe(() => set((n) => n + 1)), []);
  return state;
}

export function applyTheme(id: string) {
  const t = themeById(id);
  const root = document.documentElement;
  root.dataset.theme = t.id;
  root.dataset.themeMode = t.mode;
  const map: Record<string, string> = {
    "--canvas": t.background,
    "--surface": t.surface,
    "--surface-soft": t.surfaceSoft,
    "--surface-raised": t.surfaceRaised,
    "--text": t.text,
    "--muted": t.muted,
    "--bright": t.bright,
    "--accent": t.accent,
    "--blue": t.blue,
    "--cyan": t.cyan,
    "--green": t.green,
    "--orange": t.orange,
    "--red": t.red,
    "--yellow": t.yellow,
    "--magenta": t.magenta,
    "--border": t.muted,
  };
  for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v);
  writeFile("/home/pi/.config/omarchy/current-theme", t.id + "\n");
}

function patch(p: Partial<OsState>) {
  state = { ...state, ...p };
  emit();
}

function treeFor(ws: number): Tree {
  return state.trees[ws] ?? dw.empty();
}

function setTree(ws: number, tree: Tree) {
  patch({ trees: { ...state.trees, [ws]: tree } });
}

export function setPhase(phase: OsState["phase"]) {
  if (phase === "desktop") sessionStorage.setItem("omarchy.booted", "1");
  patch({ phase, launcher: false, cheatsheet: false, stickySuper: false });
}

export function setTheme(id: string) {
  if (!THEMES.some((t) => t.id === id)) return;
  patch({ themeId: id });
  notify("Theme", themeById(id).name, "cyan");
}

export function cycleTheme(dir: 1 | -1) {
  const i = THEMES.findIndex((t) => t.id === state.themeId);
  const next = THEMES[(i + dir + THEMES.length) % THEMES.length]!;
  setTheme(next.id);
}

export function setWorkspace(n: number) {
  const ws = Math.min(10, Math.max(1, n));
  const onWs = state.windows.filter((w) => w.workspace === ws && !w.fullscreen);
  patch({ workspace: ws, focused: onWs[onWs.length - 1]?.id ?? null, launcher: false });
}

export function nextWorkspace(dir: 1 | -1) {
  setWorkspace(((state.workspace - 1 + dir + 10) % 10) + 1);
}

export function setLauncher(open: boolean) {
  patch({ launcher: open, cheatsheet: open ? false : state.cheatsheet, stickySuper: false });
}

export function setCheatsheet(open: boolean) {
  patch({ cheatsheet: open, launcher: open ? false : state.launcher });
}

export function setSticky(on: boolean) {
  patch({ stickySuper: on });
}

export function toggleGaps() {
  patch({ gaps: !state.gaps });
}

export function toggleBar() {
  patch({ barHidden: !state.barHidden });
}

export function notify(title: string, body = "", tone: Notice["tone"] = "blue") {
  const n: Notice = { id: `n${Date.now()}${seq++}`, title, body, tone, at: Date.now() };
  patch({ notices: [...state.notices.slice(-4), n] });
  window.setTimeout(() => dismissNotice(n.id), 5200);
}

export function dismissNotice(id: string) {
  patch({ notices: state.notices.filter((n) => n.id !== id) });
}

export function dismissNotices() {
  patch({ notices: [] });
}

export function focus(id: string | null) {
  patch({ focused: id, launcher: false });
}

export function patchWin(id: string, p: Partial<Win>) {
  patch({ windows: state.windows.map((w) => (w.id === id ? { ...w, ...p } : w)) });
}

export function patchApp(id: string, app: Record<string, unknown>) {
  const w = state.windows.find((x) => x.id === id);
  if (!w) return;
  patchWin(id, { app: { ...w.app, ...app } });
}

export function bumpFs() {
  patch({ fsEpoch: state.fsEpoch + 1 });
}

const lastRects: Record<string, Rect> = {};
export function rememberRects(rects: Record<string, Rect>) {
  Object.assign(lastRects, rects);
}

function nextFloat(): Rect {
  const n = state.windows.filter((w) => w.floating).length;
  return { x: 80 + n * 28, y: 60 + n * 28, w: 640, h: 420 };
}

export function launch(appId: AppId, opts: { floating?: boolean; app?: Record<string, unknown>; title?: string } = {}) {
  const id = `w${seq++}`;
  const win: Win = {
    id,
    appId,
    title: opts.title ?? APPS[appId].title,
    workspace: state.workspace,
    floating: !!opts.floating,
    fullscreen: false,
    float: nextFloat(),
    app: { ...initialApp(appId), ...(opts.app ?? {}) },
  };
  const windows = [...state.windows, win];
  let trees = state.trees;
  if (!win.floating) {
    const tree = dw.insert(treeFor(state.workspace), id, state.focused, lastRects);
    trees = { ...trees, [state.workspace]: tree };
  }
  state = { ...state, windows, trees, focused: id, launcher: false, phase: state.phase === "boot" ? "desktop" : state.phase };
  emit();
  return id;
}

export function closeWin(id: string) {
  const w = state.windows.find((x) => x.id === id);
  if (!w) return;
  const windows = state.windows.filter((x) => x.id !== id);
  const trees = { ...state.trees, [w.workspace]: dw.remove(treeFor(w.workspace), id) };
  const same = windows.filter((x) => x.workspace === state.workspace);
  patch({ windows, trees, focused: same[same.length - 1]?.id ?? null });
}

export function closeFocused() {
  if (state.focused) closeWin(state.focused);
}

export function toggleFloat(id = state.focused) {
  if (!id) return;
  const w = state.windows.find((x) => x.id === id);
  if (!w) return;
  const floating = !w.floating;
  let tree = treeFor(w.workspace);
  tree = floating ? dw.remove(tree, id) : dw.insert(tree, id, state.focused, lastRects);
  patch({
    windows: state.windows.map((x) => (x.id === id ? { ...x, floating, fullscreen: false } : x)),
    trees: { ...state.trees, [w.workspace]: tree },
    focused: id,
  });
}

export function toggleFullscreen(id = state.focused) {
  if (!id) return;
  const w = state.windows.find((x) => x.id === id);
  if (!w) return;
  patchWin(id, { fullscreen: !w.fullscreen });
  focus(id);
}

export function moveToWorkspace(ws: number, id = state.focused) {
  if (!id) return;
  const w = state.windows.find((x) => x.id === id);
  if (!w || w.workspace === ws) {
    setWorkspace(ws);
    return;
  }
  let from = dw.remove(treeFor(w.workspace), id);
  let to = treeFor(ws);
  if (!w.floating) to = dw.insert(to, id, null, lastRects);
  patch({
    windows: state.windows.map((x) => (x.id === id ? { ...x, workspace: ws, fullscreen: false } : x)),
    trees: { ...state.trees, [w.workspace]: from, [ws]: to },
    workspace: ws,
    focused: id,
  });
}

export function focusDir(dir: "l" | "r" | "u" | "d") {
  if (!state.focused) return;
  const next = dw.nearest(lastRects, state.focused, dir);
  if (next) focus(next);
}

export function swapDir(dir: "l" | "r" | "u" | "d") {
  if (!state.focused) return;
  const other = dw.nearest(lastRects, state.focused, dir);
  if (!other) return;
  const tree = dw.swapIds(treeFor(state.workspace), state.focused, other);
  setTree(state.workspace, tree);
}

export function resizeDir(dir: "l" | "r" | "u" | "d") {
  if (!state.focused) return;
  setTree(state.workspace, dw.resizeToward(treeFor(state.workspace), state.focused, dir));
}

export function cycleWin(dir: 1 | -1) {
  const list = state.windows.filter((w) => w.workspace === state.workspace);
  if (!list.length) return;
  const i = list.findIndex((w) => w.id === state.focused);
  const next = list[(i + dir + list.length) % list.length]!;
  focus(next.id);
}

export function setFloatRect(id: string, float: Rect) {
  patchWin(id, { float });
}

export function ensureSession() {
  applyTheme(state.themeId);
  if (state.windows.length === 0 && state.phase === "desktop") {
    launch("terminal");
    launch("about");
  }
}

export function reboot() {
  sessionStorage.removeItem("omarchy.booted");
  const themeId = state.themeId;
  state = { ...fresh(), themeId, phase: "boot" };
  emit();
}

export function occupiedWorkspaces(): Set<number> {
  return new Set(state.windows.map((w) => w.workspace));
}

applyTheme(state.themeId);
