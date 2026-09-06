import { dismissNotice, useOS } from "../os/store";

export function Toasts() {
  const { notices } = useOS();
  if (!notices.length) return null;
  return (
    <div class="toasts" aria-live="polite">
      {notices.map((n) => (
        <div class={"toast tone-" + n.tone} key={n.id} role="status">
          <div>
            <b>{n.title}</b>
            {n.body && <small>{n.body}</small>}
          </div>
          <button aria-label="Dismiss" onClick={() => dismissNotice(n.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
