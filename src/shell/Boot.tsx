import { useEffect, useRef } from "preact/hooks";
import { setPhase } from "../os/store";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function Boot() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("noboot") && params.get("boot") !== "1") {
      setPhase("desktop");
      return;
    }
    const el = root.current;
    if (!el) return;
    const bullets = el.querySelector<HTMLElement>("[data-bullets]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    let typed = 0;
    let submitted = false;
    let skipped = false;

    const phase = (p: string) => el.setAttribute("data-phase", p);
    const add = () => {
      if (typed >= 21) return;
      typed++;
      bullets.append(document.createElement("i"));
    };
    const finish = async () => {
      el.classList.add("out");
      await wait(420);
      setPhase("desktop");
    };
    const submit = async () => {
      if (submitted || skipped) return;
      submitted = true;
      phase("progress");
      const t0 = performance.now();
      const dur = 1400;
      await new Promise<void>((r) => {
        const tick = () => {
          if (skipped) return r();
          const x = Math.min(1, (performance.now() - t0) / dur);
          const eased = 1 - (1 - x) * (1 - x);
          bar.style.setProperty("--p", String(eased * 0.7));
          if (x < 1) requestAnimationFrame(tick);
          else r();
        };
        requestAnimationFrame(tick);
      });
      if (skipped) return;
      bar.style.setProperty("--p", "1");
      await wait(260);
      el.classList.add("black");
      await wait(180);
      await finish();
    };
    const skip = () => {
      if (skipped) return;
      skipped = true;
      void finish();
    };
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        skip();
        return;
      }
      if (el.getAttribute("data-phase") !== "entry" || submitted) return;
      if (e.key === "Enter") {
        if (typed > 0) void submit();
      } else if (e.key === "Backspace") {
        if (typed > 0) {
          typed--;
          bullets.lastElementChild?.remove();
        }
      } else if (e.key.length === 1) add();
    };
    document.addEventListener("keydown", onKey, true);

    let alive = true;
    (async () => {
      await wait(120);
      if (!alive || skipped) return;
      phase("logo");
      await wait(500);
      if (!alive || skipped) return;
      phase("entry");
      await wait(2000);
      if (!alive || skipped || submitted) return;
      if (typed === 0) {
        for (let i = 0; i < 9; i++) {
          add();
          await wait(55);
          if (!alive || skipped || submitted) return;
        }
      }
      await wait(260);
      if (!alive || skipped || submitted) return;
      void submit();
    })();

    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  return (
    <div class="boot" ref={root} role="dialog" aria-label="Boot">
      <img src="/boot-logo.png" alt="Omarchy" />
      <div class="boot-entry" data-boot-entry>
        <span aria-hidden="true">🔒</span>
        <div class="boot-field">
          <div class="boot-bullets" data-bullets />
        </div>
      </div>
      <div class="boot-progress">
        <i class="boot-bar" data-bar />
      </div>
    </div>
  );
}
