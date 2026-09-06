import { bumpFs, patchApp, patchWin } from "../os/store";
import { readFile, writeFile } from "../fs/vfs";
import type { Win } from "../os/types";

export function Editor({ win }: { win: Win }) {
  const path = String(win.app.path ?? "/home/pi/README.md");
  const stored = win.app.content;
  const content = typeof stored === "string" ? stored : (readFile(path) ?? "");
  const dirty = Boolean(win.app.dirty);

  const save = () => {
    const err = writeFile(path, content);
    if (!err) {
      patchApp(win.id, { dirty: false });
      bumpFs();
    }
  };

  return (
    <div class="editor">
      <div class="editor-bar">
        <span>{path}{dirty ? " *" : ""}</span>
        <button onClick={save}>save</button>
      </div>
      <textarea
        value={content}
        spellcheck={false}
        onInput={(e) => {
          const v = (e.target as HTMLTextAreaElement).value;
          patchApp(win.id, { content: v, dirty: true });
          patchWin(win.id, { title: (path.split("/").pop() ?? "editor") + " *" });
        }}
      />
      <div class="editor-status">
        <span>{content.length} bytes · {content.split("\n").length} lines</span>
        <span>Ctrl+S in a real nvim. Click save here.</span>
      </div>
    </div>
  );
}
