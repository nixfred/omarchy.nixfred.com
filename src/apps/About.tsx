import { useOS } from "../os/store";
import { themeById } from "../theme/themes";
import { LOGO } from "../fs/vfs";

export function About() {
  const s = useOS();
  const t = themeById(s.themeId);
  return (
    <div class="about">
      <pre class="logo">{LOGO}</pre>
      <dl>
        <dt>OS</dt><dd>Omarchy 4.0.2</dd>
        <dt>Host</dt><dd>omarchy.nixfred.com</dd>
        <dt>WM</dt><dd>Hyprland · dwindle</dd>
        <dt>Theme</dt><dd>{t.name}</dd>
        <dt>Windows</dt><dd>{s.windows.length} on workspace {s.workspace}</dd>
        <dt>What this is</dt>
        <dd>A real Omarchy session in the browser. Not a screenshot. Super+Space, Super+Return, Super+K.</dd>
      </dl>
    </div>
  );
}
