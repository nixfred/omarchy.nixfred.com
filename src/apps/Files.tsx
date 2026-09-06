import { launch, patchApp } from "../os/store";
import { list, readFile, resolve, stat } from "../fs/vfs";
import type { Win } from "../os/types";

export function Files({ win }: { win: Win }) {
  const path = String(win.app.path ?? "/home/pi");
  const node = stat(path);
  const kids = node?.type === "dir" ? list(path) ?? [] : [];
  const parts = path.split("/").filter(Boolean);

  const open = (name: string) => {
    const next = resolve(name, path);
    const n = stat(next);
    if (!n) return;
    if (n.type === "dir") patchApp(win.id, { path: next });
    else {
      const content = readFile(next) ?? "";
      launch("editor", { app: { path: next, content, dirty: false }, title: n.name });
    }
  };

  return (
    <div class="files">
      <div class="crumb">
        <button onClick={() => patchApp(win.id, { path: "/" })}>/</button>
        {parts.map((p, i) => (
          <span key={i}>
            <span>›</span>{" "}
            <button onClick={() => patchApp(win.id, { path: "/" + parts.slice(0, i + 1).join("/") })}>{p}</button>
          </span>
        ))}
      </div>
      <div class="file-list">
        {path !== "/" && (
          <button class="file-row dir" onDblClick={() => patchApp(win.id, { path: resolve("..", path) })} onClick={() => patchApp(win.id, { path: resolve("..", path) })}>
            <span class="ico">📁</span>
            <span>..</span>
            <small>parent</small>
          </button>
        )}
        {node?.type === "file" && <div class="file-row"><span>not a directory</span></div>}
        {kids.map((k) => (
          <button key={k.name} class={"file-row" + (k.type === "dir" ? " dir" : "")} onClick={() => open(k.name)}>
            <span class="ico">{k.type === "dir" ? "📁" : "📄"}</span>
            <span>{k.name}</span>
            <small>{k.type}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
