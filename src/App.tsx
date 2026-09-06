import { useEffect } from "preact/hooks";
import { bindKeys } from "./os/keys";
import { setPhase, useOS } from "./os/store";
import { Boot } from "./shell/Boot";
import { Lock } from "./shell/Lock";
import { Screensaver } from "./shell/Screensaver";
import { Desktop } from "./wm/Desktop";

export function App() {
  const { phase } = useOS();

  useEffect(() => bindKeys(), []);

  useEffect(() => {
    if (phase !== "lock") return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setPhase("desktop");
    };
    window.addEventListener("keydown", onEsc, true);
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [phase]);

  if (phase === "boot") return <Boot />;
  if (phase === "lock") return <Lock />;
  if (phase === "screensaver") return <Screensaver />;
  return <Desktop />;
}
