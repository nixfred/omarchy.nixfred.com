import type { Rect, Win } from "../os/types";
import { closeWin, focus, setFloatRect } from "../os/store";
import { Terminal } from "../apps/Terminal";
import { Browser } from "../apps/Browser";
import { Files } from "../apps/Files";
import { Editor } from "../apps/Editor";
import { Settings } from "../apps/Settings";
import { Btop } from "../apps/Btop";
import { About } from "../apps/About";

export function WindowView({ win, rect, focused }: { win: Win; rect: Rect; focused: boolean }) {
  const onTitleDown = (e: MouseEvent) => {
    focus(win.id);
    if (!win.floating || win.fullscreen) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = { ...win.float };
    const move = (ev: MouseEvent) => {
      setFloatRect(win.id, { ...orig, x: orig.x + ev.clientX - sx, y: Math.max(0, orig.y + ev.clientY - sy) });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <section
      class={"os-window" + (focused ? " focused" : "") + (win.floating ? " floating" : "") + (win.fullscreen ? " fullscreen" : "")}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      onMouseDown={() => focus(win.id)}
      aria-label={win.title}
    >
      <header class="win-title" onMouseDown={onTitleDown}>
        <span class="dot" />
        <b>{win.title}</b>
        <button class="win-x" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeWin(win.id); }}>×</button>
      </header>
      <div class="win-body">
        <AppBody win={win} focused={focused} />
      </div>
    </section>
  );
}

function AppBody({ win, focused }: { win: Win; focused: boolean }) {
  switch (win.appId) {
    case "terminal": return <Terminal win={win} focused={focused} />;
    case "browser": return <Browser win={win} />;
    case "files": return <Files win={win} />;
    case "editor": return <Editor win={win} />;
    case "settings": return <Settings win={win} />;
    case "btop": return <Btop />;
    case "about": return <About />;
  }
}
