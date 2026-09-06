import { patchApp } from "../os/store";
import type { Win } from "../os/types";

const STARTS = [
  { href: "https://omarchy.org", title: "omarchy.org", sub: "the distro" },
  { href: "https://learn.omarchy.org", title: "Manual", sub: "learn.omarchy.org" },
  { href: "https://github.com/basecamp/omarchy", title: "GitHub", sub: "basecamp/omarchy" },
  { href: "https://omarchyplugins.com", title: "Plugins", sub: "1,700+ community plugins" },
  { href: "https://iso.omarchy.org", title: "ISO", sub: "install it for real" },
  { href: "https://nixfred.com", title: "nixfred.com", sub: "the person who put this in a browser" },
];

function proxyUrl(url: string) {
  return "/proxy?url=" + encodeURIComponent(url);
}

export function Browser({ win }: { win: Win }) {
  const url = String(win.app.url ?? "omarchy://start");
  const input = String(win.app.input ?? url);

  const go = (raw: string) => {
    let next = raw.trim();
    if (!next) return;
    if (next === "omarchy://start" || next === "about:start") {
      patchApp(win.id, { url: "omarchy://start", input: "omarchy://start" });
      return;
    }
    if (!/^https?:\/\//i.test(next) && !next.includes("://")) {
      if (next.includes(".") && !next.includes(" ")) next = "https://" + next;
      else next = "https://duckduckgo.com/?q=" + encodeURIComponent(next);
    }
    patchApp(win.id, { url: next, input: next });
  };

  return (
    <div class="browser">
      <form
        class="browser-bar"
        onSubmit={(e) => {
          e.preventDefault();
          go(input);
        }}
      >
        <button type="button" onClick={() => go("omarchy://start")} title="Start">⌂</button>
        <input
          value={input}
          spellcheck={false}
          aria-label="Address"
          onInput={(e) => patchApp(win.id, { input: (e.target as HTMLInputElement).value })}
        />
        <button type="submit">Go</button>
      </form>
      {url === "omarchy://start" ? (
        <div class="start">
          <h1>Omarchy</h1>
          <p>A browser inside a browser. Simple sites load through a Pages proxy. Logins and heavy SPAs often will not — same as any framed web.</p>
          <div class="start-grid">
            {STARTS.map((s) => (
              <button key={s.href} onClick={() => go(s.href)}>
                {s.title}
                <small>{s.sub}</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <iframe title="Browser" src={proxyUrl(url)} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      )}
    </div>
  );
}
