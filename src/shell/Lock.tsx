import { useEffect, useRef, useState } from "preact/hooks";
import { setPhase, useOS } from "../os/store";
import { themeById } from "../theme/themes";

export function Lock() {
  const { themeId } = useOS();
  const theme = themeById(themeId);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const submit = (pw: string) => {
    if (!pw || checking) return;
    setChecking(true);
    setMsg("Checking…");
    window.setTimeout(() => {
      setPhase("desktop");
    }, 280);
  };

  return (
    <div class="lock" onMouseDown={() => input.current?.focus()}>
      <div class="lock-wp" style={{ backgroundImage: `url(${theme.wallpaper})` }} />
      <form
        class={"lock-field" + (msg && !checking ? " error" : "")}
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
          setValue("");
        }}
      >
        <input
          ref={input}
          type="password"
          value={value}
          autocomplete="off"
          spellcheck={false}
          aria-label="Password"
          onInput={(e) => {
            setValue((e.target as HTMLInputElement).value);
            setMsg("");
          }}
        />
        {value.length === 0 && (
          <div class={"lock-ph" + (msg && !checking ? " error" : "")}>
            {msg || "Enter Password"}
          </div>
        )}
      </form>
      <p class="lock-hint">any password unlocks · Esc does too · Super+Ctrl+L to lock</p>
    </div>
  );
}
