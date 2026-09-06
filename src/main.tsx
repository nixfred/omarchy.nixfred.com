import { render } from "preact";
import { App } from "./App";
import { applyTheme, get } from "./os/store";

applyTheme(get().themeId);
console.info(
  "%c omarchy %c a Hyprland session in your browser. Super is Alt. Super+Space, Super+Return, Super+K.",
  "background:#7aa2f7;color:#0a0b10;font-weight:700;padding:2px 6px",
  "color:#a9b1d6;padding:2px 6px",
);

render(<App />, document.getElementById("root")!);
