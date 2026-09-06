import { patchApp, setTheme, useOS } from "../os/store";
import { THEMES, themeById } from "../theme/themes";
import type { Win } from "../os/types";

export function Settings({ win }: { win: Win }) {
  const tab = String(win.app.tab ?? "appearance");
  const s = useOS();
  const current = themeById(s.themeId);

  return (
    <div class="settings">
      <nav class="set-nav">
        {["appearance", "keybindings", "about"].map((t) => (
          <button key={t} class={tab === t ? "on" : ""} onClick={() => patchApp(win.id, { tab: t })}>
            {t}
          </button>
        ))}
      </nav>
      <div class="set-body">
        {tab === "appearance" && (
          <>
            <p class="hint">Stock Omarchy 4 palettes. Same files as <code>/usr/share/omarchy/themes</code>.</p>
            <div class="theme-grid">
              {THEMES.map((t) => (
                <button key={t.id} class={"theme-card" + (t.id === current.id ? " on" : "")} onClick={() => setTheme(t.id)}>
                  <div class="swatch" style={{ backgroundImage: `url(${t.wallpaper})`, backgroundColor: t.background }} />
                  <div class="meta">
                    <b>{t.name}</b>
                    <small>{t.mode}</small>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "keybindings" && (
          <p>
            Super+K for the full list. Super is <b>Alt</b> in this session.
            Tap Alt to sticky-Super if the browser eats a chord.
          </p>
        )}
        {tab === "about" && (
          <div>
            <p>Omarchy 4.0.2 simulated on Hyprland dwindle.</p>
            <p>This is not a VM. It is a faithful session: tiling, themes, a filesystem, a terminal, a browser.</p>
            <p>Live: <a href="https://omarchy.org" target="_blank" rel="noreferrer">omarchy.org</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
