import type { AppId } from "./types";
import {
  closeFocused,
  cycleTheme,
  cycleWin,
  dismissNotices,
  focusDir,
  get,
  launch,
  moveToWorkspace,
  nextWorkspace,
  reboot,
  resizeDir,
  setCheatsheet,
  setLauncher,
  setPhase,
  setSticky,
  setWorkspace,
  swapDir,
  toggleBar,
  toggleFloat,
  toggleFullscreen,
  toggleGaps,
} from "./store";

const SUPER_APPS: Record<string, AppId> = {
  Enter: "terminal",
  b: "browser",
  f: "files",
  n: "editor",
  t: "btop",
};

let stickyTimer = 0;
let altDownAt = 0;
let usedAsChord = false;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

/** Alt is Super in the browser. Meta too, when the host lets it through. */
export function isSuperHeld(e: KeyboardEvent): boolean {
  return e.altKey || e.metaKey;
}

export function bindKeys() {
  const onDown = (e: KeyboardEvent) => {
    const s = get();
    if (s.phase === "boot") return;
    if (s.phase === "screensaver") {
      e.preventDefault();
      setPhase("desktop");
      return;
    }
    if (s.phase === "lock") return;

    if (e.key === "Alt" || e.key === "Meta") {
      altDownAt = performance.now();
      usedAsChord = false;
      return;
    }

    const sticky = s.stickySuper;
    const superHeld = isSuperHeld(e);
    const asSuper = superHeld || sticky;
    if (superHeld || sticky) usedAsChord = true;

    if (e.key === "Escape") {
      if (s.launcher) {
        e.preventDefault();
        setLauncher(false);
        return;
      }
      if (s.cheatsheet) {
        e.preventDefault();
        setCheatsheet(false);
        return;
      }
    }

    if (!asSuper) return;
    e.preventDefault();
    e.stopPropagation();
    if (sticky) setSticky(false);

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;

    if (key >= "1" && key <= "9") {
      const n = Number(key);
      if (shift) moveToWorkspace(n);
      else setWorkspace(n);
      return;
    }
    if (key === "0") {
      if (shift) moveToWorkspace(10);
      else setWorkspace(10);
      return;
    }

    if (key === " " || key === "Spacebar") {
      if (shift) toggleBar();
      else setLauncher(!get().launcher);
      return;
    }
    if (key === "Enter") {
      if (shift) launch("browser");
      else launch("terminal");
      return;
    }
    if (key === "k") {
      setCheatsheet(!get().cheatsheet);
      return;
    }
    if (key === "w") {
      closeFocused();
      return;
    }
    if (key === "t" && !shift && !ctrl) {
      toggleFloat();
      return;
    }
    if (key === "f" && !shift) {
      toggleFullscreen();
      return;
    }
    if (key === "l" && ctrl) {
      setPhase("lock");
      return;
    }
    if (key === "l" && !ctrl && !shift) {
      /* Super+L is layout toggle on real Omarchy; we lock with Super+Ctrl+L.
         Super+L alone focuses left, matching Super+Left. */
      focusDir("l");
      return;
    }
    if (key === "[" || key === "-") {
      cycleTheme(-1);
      return;
    }
    if (key === "]" || key === "=") {
      cycleTheme(1);
      return;
    }
    if (key === ",") {
      dismissNotices();
      return;
    }
    if (key === "Backspace") {
      if (shift) toggleGaps();
      return;
    }
    if (key === "Tab") {
      if (ctrl) {
        /* former workspace: ignore */
      } else if (shift) nextWorkspace(-1);
      else nextWorkspace(1);
      return;
    }

    const arrow: Record<string, "l" | "r" | "u" | "d"> = {
      ArrowLeft: "l",
      ArrowRight: "r",
      ArrowUp: "u",
      ArrowDown: "d",
      h: "l",
      j: "d",
      k: "u",
      // k is cheatsheet; hjkl only for arrows + h/j. Super+K is cheatsheet.
    };
    if (key === "h" || key === "j" || key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
      const d = arrow[key];
      if (!d) return;
      if (shift) swapDir(d);
      else if (ctrl) resizeDir(d);
      else focusDir(d);
      return;
    }

    if (shift && SUPER_APPS[key]) {
      launch(SUPER_APPS[key]!);
      return;
    }
    if (ctrl && key === "t") {
      launch("btop");
      return;
    }
  };

  const onUp = (e: KeyboardEvent) => {
    if (e.key !== "Alt" && e.key !== "Meta") return;
    const held = performance.now() - altDownAt;
    if (!usedAsChord && held < 500 && get().phase === "desktop") {
      setSticky(true);
      window.clearTimeout(stickyTimer);
      stickyTimer = window.setTimeout(() => setSticky(false), 1500);
    }
  };

  const onClick = () => {
    if (get().stickySuper) setSticky(false);
  };

  window.addEventListener("keydown", onDown, true);
  window.addEventListener("keyup", onUp, true);
  window.addEventListener("mousedown", onClick, true);

  void isTypingTarget;
  return () => {
    window.removeEventListener("keydown", onDown, true);
    window.removeEventListener("keyup", onUp, true);
    window.removeEventListener("mousedown", onClick, true);
  };
}
