/* omarchy.nixfred.com — renders everything from data.json
 *
 * Every heading on the page is static HTML and everything under it is built
 * here. So when this file does not run, the page is a list of headings with
 * nothing beneath them, which reads as a design rather than a fault. That
 * happened on 2026-09-11: a browser had cached the SPA fallback HTML under this
 * file's URL, back when a missing asset answered 200 with the index page, and
 * `immutable` in _headers pinned it there through every reload.
 *
 * Three things now stop that: site/404.html makes a missing path a real 404,
 * _headers no longer promises `immutable`, and index.html watches for this
 * script having produced nothing and says so with a way out. That last guard
 * has to live in the HTML — a file that fails to parse cannot report itself.
 */
(() => {
  "use strict";

  // Signals for the watchdog in index.html. It used to infer failure from "the
  // page looks empty", which is not the same thing and made a slow load
  // indistinguishable from a broken one. These say what actually happened.
  window.__appLoaded = true;   // this file parsed and began running
  window.__appReady = false;   // set true once the catalogue is on screen

  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Scroll a plugin's own card into view and flash its border. Clearing the
      search and the family filter first is what makes this reliable: a card
      filtered out of the grid has no element to scroll to. */
  function jumpToCard(id, accent) {
    if (!document.getElementById(`p-${id}`)) {
      state.q = ""; state.fam = "all"; $("#q").value = ""; render();
    }
    requestAnimationFrame(() => {
      const c = document.getElementById(`p-${id}`);
      if (!c) return;
      c.scrollIntoView({ block: "center", behavior: REDUCED ? "auto" : "smooth" });
      if (accent) { c.style.borderColor = accent; setTimeout(() => (c.style.borderColor = ""), 1400); }
    });
  }

  const ICON = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18l-1.5 11H4.5L3 9Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z"/></svg>',
    arrow: '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg class="chv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    dotm: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="4"/></svg>',
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8ZM12 17v5"/></svg>',
  };

  // Widgets that live in the hero bar. type drives the animation.
  const BAR = [
    { id: "nixfred.workspace-names", type: "text", label: "3 · build" },
    // One widget, because that is the whole point of Pulse: the icon follows
    // whatever is the biggest constraint rather than showing four fixed metrics.
    { id: "nixfred.pulse", type: "bars", n: 8, label: "pulse" },
    { id: "spacer" },
    { id: "nixfred.beatdeck", type: "eq", n: 7 },
    { id: "pi.audio", type: "eq", n: 4, label: "62" },
    { id: "pi.bluetooth", type: "sonar" },
    { id: "nixfred.blip", type: "badge" },
    { id: "nixfred.internet-latency", type: "ms", label: "ms" },
    { id: "nixfred.burnbar", type: "ring", label: "burn" },
    { id: "pi.power", type: "cell", label: "" },
    { id: "nixfred.chronos", type: "clock" },
  ];

  let DATA = null;
  const state = { q: "", fam: "all" };

  // ─────────────────────────────────────────────────────── the live bar

  function buildBar() {
    const bar = $("#omabar"), tip = $("#bartip");
    const byId = new Map(DATA.plugins.map((p) => [p.id, p]));
    const anim = [];

    for (const w of BAR) {
      if (w.id === "spacer") { bar.append(el("div", "spacer")); continue; }
      const p = byId.get(w.id);
      if (!p) continue;

      const n = el("button", "w");
      n.style.setProperty("--wa", p.accent);
      n.type = "button";
      n.setAttribute("aria-label", `${p.name} — jump to plugin`);

      let inner = "";
      switch (w.type) {
        case "dot": inner = '<span class="dot"></span>'; break;
        case "bars": inner = `<span class="bars">${'<i></i>'.repeat(w.n)}</span>`; break;
        case "eq": inner = `<span class="eq">${'<i></i>'.repeat(w.n)}</span>`; break;
        case "sonar": inner = '<span class="sonar"></span>'; break;
        case "badge": inner = '<span class="badge">3</span>'; break;
        case "cell": inner = '<span class="cell"><span class="fill"></span></span>'; break;
        case "ring": inner = '<svg class="ring" viewBox="0 0 24 24"><circle class="trk" cx="12" cy="12" r="9"/><circle class="val" cx="12" cy="12" r="9" stroke-dasharray="56.5" stroke-dashoffset="20"/></svg>'; break;
        case "spark": inner = '<svg class="spark" viewBox="0 0 46 14" preserveAspectRatio="none"><path d=""/></svg>'; break;
      }
      if (w.label != null && w.type !== "ms") inner += `<span class="lbl">${esc(w.label)}</span>`;
      if (w.type === "ms") inner = `<span class="lbl">12 ms</span>`;
      if (w.type === "clock") inner = `<span class="lbl">--:--</span>`;
      n.innerHTML = inner;

      n.addEventListener("click", () => jumpToCard(p.id, p.accent));
      const show = (e) => {
        tip.textContent = `${p.name} — ${p.tagline}`;
        tip.classList.add("on"); tip.setAttribute("aria-hidden", "false");
        const r = n.getBoundingClientRect();
        tip.style.left = `${Math.min(Math.max(8, r.left), innerWidth - tip.offsetWidth - 8)}px`;
        tip.style.top = `${r.bottom + 8}px`;
      };
      const hide = () => { tip.classList.remove("on"); tip.setAttribute("aria-hidden", "true"); };
      n.addEventListener("mouseenter", show);
      n.addEventListener("focus", show);
      n.addEventListener("mouseleave", hide);
      n.addEventListener("blur", hide);

      bar.append(n);
      anim.push({ w, n });
    }
    return anim;
  }

  function animateBar(anim) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spark = new Map();

    const slow = () => {
      for (const { w, n } of anim) {
        if (w.type === "bars") {
          n.querySelectorAll(".bars i").forEach((i) => (i.style.height = `${rnd(15, 100)}%`));
        } else if (w.type === "ring") {
          const c = 2 * Math.PI * 9;
          n.querySelector(".val").style.strokeDashoffset = String(c * (1 - rnd(0.25, 0.92)));
        } else if (w.type === "cell") {
          const pct = rnd(46, 96);
          n.querySelector(".fill").style.setProperty("--pct", `${pct}%`);
          n.style.setProperty("--wa", pct > 66 ? "#5ad1ff" : pct > 33 ? "#ffc857" : "#ff5c5c");
        } else if (w.type === "ms") {
          n.querySelector(".lbl").textContent = `${Math.round(rnd(8, 34))} ms`;
        } else if (w.type === "spark") {
          const key = w.id;
          const pts = spark.get(key) ?? Array.from({ length: 16 }, () => rnd(2, 12));
          pts.shift(); pts.push(rnd(1.5, 12.5)); spark.set(key, pts);
          const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 46} ${14 - v}`).join(" ");
          n.querySelector(".spark path").setAttribute("d", d);
        } else if (w.type === "clock") {
          n.querySelector(".lbl").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }
    };

    const fast = () => {
      for (const { w, n } of anim) {
        if (w.type !== "eq") continue;
        n.querySelectorAll(".eq i").forEach((i) => (i.style.height = `${rnd(12, 100)}%`));
      }
    };

    slow();
    if (REDUCED) return;
    fast();
    let t = 0, last = 0;
    const loop = (now) => {
      if (now - last > 110) { fast(); last = now; }
      if (++t % 1 === 0) { /* keep rAF cheap */ }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    setInterval(slow, 1500);
  }

  // ─────────────────────────────────────────────────────── cards


  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—";
  const ago = (iso) => {
    if (!iso) return "—";
    const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
    if (d <= 0) return "today";
    if (d === 1) return "yesterday";
    if (d < 30) return `${d}d ago`;
    if (d < 365) return `${Math.round(d / 30)}mo ago`;
    return `${(d / 365).toFixed(1)}y ago`;
  };

  /** A copy-to-clipboard box. The command travels in a data attribute so the
      visible label can be shortened without changing what lands on the clipboard. */
  function cmdBox(label, cmd) {
    if (!cmd) return "";
    return `<div class="cmd-row">
      <span class="cmd-label">${esc(label)}</span>
      <button class="cmd-box" type="button" data-cmd="${esc(cmd)}" title="Copy: ${esc(cmd)}">
        <code>${esc(cmd)}</code>${ICON.copy}
      </button>
    </div>`;
  }

  /** Everything GitHub knows about the plugin, folded away until asked for. */
  function detailsBlock(p) {
    if (!p.repo) return "";
    // Numbers are set large; text values are set smaller so they are not
    // truncated in a narrow card column.
    const cells = [
      ["stars", p.stars],
      ["forks", p.forks],
      ["watching", p.watchers],
      ["open PRs", p.open_prs],
      ["open issues", p.open_issues],
      ["commits", p.commits || "—"],
      ["language", p.language || "—", true],
      ["licence", p.license || "—", true],
      ["release", p.release ? p.release.tag : "—", true],
      ["created", fmtDate(p.created), true],
      ["last push", ago(p.pushed), true],
      ["branch", p.default_branch || "—", true],
    ];

    const people = (p.contributors || []).length
      ? `<div class="who">
           <span class="who-h">${p.contributors.length} contributor${p.contributors.length === 1 ? "" : "s"}</span>
           <div class="faces">${p.contributors.map((c) =>
             `<a href="https://github.com/${esc(c.login)}" target="_blank" rel="noopener"
                 title="${esc(c.login)} — ${c.commits} commit${c.commits === 1 ? "" : "s"}">
                <img src="${esc(c.avatar)}&s=64" alt="${esc(c.login)}" loading="lazy" decoding="async">
              </a>`).join("")}</div>
         </div>`
      : "";

    /** Every open pull request or issue, by title, not just a count. */
    const queue = (heading, items, cls) => {
      if (!items || !items.length) return "";
      return `<div class="q">
        <span class="who-h">${esc(heading)} <b>${items.length}</b></span>
        <ul class="q-list">${items.map((q) => `
          <li class="${cls}">
            <a href="${esc(q.url)}" target="_blank" rel="noopener">
              <span class="q-n">#${q.number}</span>
              <span class="q-t">${esc(q.title)}${q.draft ? ' <em class="q-d">draft</em>' : ""}</span>
              <span class="q-m">@${esc(q.author)} · ${esc(ago(q.created))}</span>
            </a>
          </li>`).join("")}</ul>
      </div>`;
    };

    return `<details class="drop">
      <summary><span>Details</span>${ICON.chev}</summary>
      <div class="drop-body">
        <div class="kv">${cells.map(([k, v, isText]) =>
          `<div class="kv-c"><b${isText ? ' class="t"' : ""}>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join("")}</div>
        ${queue("Open pull requests", p.prs, "pr")}
        ${queue("Open issues", p.issues, "iss")}
        ${people}
        <div class="cmds">
          ${cmdBox("Install", p.install)}
          ${cmdBox("Clone", p.clone)}
        </div>
      </div>
    </details>`;
  }

  function statusTags(p) {
    const t = [];
    if (p.listed) {
      const when = p.listed_at ? new Date(p.listed_at).toISOString().slice(0, 10) : "";
      t.push(`<a class="tag listed" href="${esc(p.listing_url)}" title="Listed on the official Omarchy marketplace${when ? ` on ${when}` : ""}">${ICON.check} listed</a>`);
    } else if (p.status === "live") {
      t.push(`<span class="tag pending" title="Not submitted to the official marketplace yet. This flips on its own when it is.">${ICON.dotm} not submitted</span>`);
    }
    if (p.status === "developing") t.push(`<span class="tag developing" title="Still being built. Public source and installable, but expect rough edges and breaking changes before 1.0.">${ICON.dotm} developing</span>`);
    if (p.status === "shelved") t.push(`<span class="tag shelved">shelved</span>`);
    if (p.status === "unreleased") t.push(`<span class="tag unreleased">unreleased</span>`);
    if (p.fork_of) t.push(`<span class="tag fork" title="A fork of ${esc(p.fork_of)}">fork</span>`);
    if (p.stars > 0) t.push(`<span class="tag stars">${ICON.star} ${p.stars}</span>`);
    return t.join("");
  }

  /** Make the whole card a hit target for its own DETAILS dropdown.
   *
   *  Two things this must not do. It must not swallow a click meant for
   *  something else - the Source button, a pull-request link, a copy box, the
   *  summary itself all handle their own clicks, and `closest()` is what lets
   *  them through. And it must not fire inside the open dropdown, or reading
   *  the repo record would close the thing you are reading, and selecting text
   *  in there would be impossible.
   */
  function clickOpensDetails(node) {
    const drop = node.querySelector("details.drop");
    if (!drop) return;
    node.addEventListener("click", (e) => {
      if (e.target.closest("a, button, summary, input, .drop-body")) return;
      if (!getSelection().isCollapsed) return;   // a drag that selected text
      drop.open = !drop.open;
    });
  }

  function card(p) {
    const c = el("article", "card" + (p.status === "live" ? "" : " is-quiet"));
    c.id = `p-${p.id}`;
    c.style.setProperty("--ca", p.accent);

    const links = [];
    if (p.repo_url) links.push(`<a class="btn" href="${esc(p.repo_url)}" target="_blank" rel="noopener">${ICON.github} Source</a>`);
    if (p.listing_url) links.push(`<a class="btn primary" href="${esc(p.listing_url)}" target="_blank" rel="noopener">${ICON.store} Marketplace</a>`);

    c.innerHTML = `
      <div class="top">
        <div class="glyph" data-glyph="${esc(p.glyph)}">${ICON.plug}</div>
        <div class="hd">
          <h3>${esc(p.name)} <span class="ver">v${esc(p.version)}</span></h3>
          <div class="tagline">${esc(p.tagline)}</div>
        </div>
      </div>
      ${p.shot ? `<img class="shot" src="${esc(p.shot)}" alt="${esc(p.name)} running in the Omarchy bar" loading="lazy" decoding="async">` : ""}
      <p class="desc">${esc(p.description)}</p>
      <div class="tags">${statusTags(p)}</div>
      <div class="foot">${links.join("")}</div>
      ${detailsBlock(p)}`;

    // Swap in the real glyph when Codex's SVG exists; the plug icon is the fallback.
    const holder = c.querySelector(".glyph");
    fetch(p.glyph).then((r) => (r.ok ? r.text() : null)).then((svg) => {
      if (svg && svg.trim().startsWith("<svg")) holder.innerHTML = svg;
    }).catch(() => {});

    clickOpensDetails(c);
    return c;
  }

  // ─────────────────────────────────────────────────────── render

  function match(p) {
    if (state.fam !== "all" && p.family !== state.fam) return false;
    if (state.fam === "listed" && !p.listed) return false;
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.tagline, p.description, p.id, p.family].join(" ").toLowerCase().includes(q);
  }

  function render() {
    const host = $("#families");
    host.textContent = "";
    let shown = 0;

    // Fred's rule: newest created first, even when filtered. Family grouping would
    // reorder results, so any active search or family filter renders one flat grid
    // straight off DATA.plugins, which the build already sorted newest-first.
    if (state.q.trim() || state.fam !== "all") {
      const items = DATA.plugins.filter(match);
      const s = el("section");
      const wrap = el("div", "wrap");
      const label = state.fam === "all"
        ? `Results for “${esc(state.q)}”`
        : esc(DATA.families.find((f) => f.id === state.fam)?.name ?? state.fam);
      wrap.innerHTML = `<header><h2>${label} <span class="count">${items.length}</span></h2>
        <p>Newest first.</p></header>`;
      const grid = el("div", "grid");
      items.forEach((p) => grid.append(card(p)));
      wrap.append(grid);
      s.append(wrap);
      host.append(s);
      shown = items.length;
      if (!shown) host.innerHTML = `<div class="wrap"><div class="slot">Nothing matches “${esc(state.q)}”.</div></div>`;
      for (const b of $("#chips").children) b.setAttribute("aria-pressed", String(b.dataset.fam === state.fam));
      return;
    }

    for (const f of DATA.families) {
      const items = DATA.plugins.filter((p) => p.family === f.id && match(p));
      if (!items.length) continue;
      shown += items.length;

      const s = el("section");
      s.id = `f-${f.id}`;
      const wrap = el("div", "wrap");
      wrap.innerHTML = `<header>
          <h2><span class="fam-ico" data-fam="${esc(f.id)}"></span>${esc(f.name)} <span class="count">${items.length}</span></h2>
          <p>${esc(f.blurb)}</p>
        </header>`;
      const grid = el("div", "grid");
      items.forEach((p) => grid.append(card(p)));
      wrap.append(grid);
      s.append(wrap);
      host.append(s);

      const ico = wrap.querySelector(".fam-ico");
      fetch(`assets/img/family/${f.id}.svg`).then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) ico.innerHTML = svg;
      }).catch(() => {});
    }

    if (!shown) {
      host.append(Object.assign(el("div", "wrap"), { innerHTML: `<div class="slot">Nothing matches “${esc(state.q)}”.</div>` }));
    }

    for (const b of $("#chips").children) {
      b.setAttribute("aria-pressed", String(b.dataset.fam === state.fam));
    }
  }

  /** The hero's right half: compact links to the featured plugins, filling the
      column beside the copy rather than leaving it empty. */
  function heroFeature() {
    const byId = new Map(DATA.plugins.map((p) => [p.id, p]));
    const host = $("#hero-feature");

    const inlineSvg = (node, url) =>
      fetch(url).then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) node.innerHTML = svg;
      }).catch(() => {});

    const rows = [];

    for (const id of ["nixfred.infomarchy", "nixfred.blip", "nixfred.pulse"]) {
      const p = byId.get(id);
      if (!p) continue;
      rows.push({
        // The hero link goes to the plugin's CARD, not off to GitHub. The card
        // is where the screenshot, the figures and the repo dropdown already
        // live, so leaving the site was always the worse of the two.
        card: p.id,
        href: `#p-${p.id}`,
        external: false,
        accent: p.accent,
        glyph: p.glyph,
        kicker: "flagship",
        title: p.name,
        meta: `v${p.version}`,
        tagline: p.tagline,
        tags: statusTags(p),
      });
    }


    for (const r of rows) {
      const a = el("a", "hero-link");
      a.href = r.href;
      if (r.external) { a.target = "_blank"; a.rel = "noopener"; }
      if (r.card) a.addEventListener("click", (e) => { e.preventDefault(); jumpToCard(r.card, r.accent); });
      a.style.setProperty("--ca", r.accent);
      a.innerHTML = `
        <span class="g">${ICON.plug}</span>
        <span class="body">
          <span class="k">${esc(r.kicker)}</span>
          <span class="t">${esc(r.title)} <span class="ver">${esc(r.meta)}</span></span>
          <span class="tl">${esc(r.tagline)}</span>
          <span class="tags">${r.tags}</span>
        </span>
        <span class="arrw">${ICON.arrow}</span>`;
      inlineSvg(a.querySelector(".g"), r.glyph);
      host.append(a);
    }
  }

  /** Two flagships and the six-strong Pulse family, above the catalogue. */
  function featured() {
    const byId = new Map(DATA.plugins.map((p) => [p.id, p]));
    const grid = $("#feat-grid");

    const solo = (id, kicker) => {
      const p = byId.get(id);
      if (!p) return null;
      const n = el("article", "feat");
      n.style.setProperty("--ca", p.accent);
      n.innerHTML = `
        <div class="kicker">${esc(kicker)}</div>
        <div class="mark" data-g="${esc(p.glyph)}">${ICON.plug}</div>
        <h3>${esc(p.name)}</h3>
        <div class="tagline">${esc(p.tagline)}</div>
        ${p.shot ? `<img class="shot" src="${esc(p.shot)}" alt="${esc(p.name)} running in the Omarchy bar" loading="lazy" decoding="async">` : ""}
        <p class="d">${esc(p.description)}</p>
        <div class="tags">${statusTags(p)}</div>
        <div class="foot">
          ${p.repo_url ? `<a class="btn primary" href="${esc(p.repo_url)}" target="_blank" rel="noopener">${ICON.github} Source</a>` : ""}
          ${p.listing_url ? `<a class="btn" href="${esc(p.listing_url)}" target="_blank" rel="noopener">${ICON.store} Marketplace</a>` : ""}
        </div>
        ${detailsBlock(p)}`;
      fetch(p.glyph).then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) n.querySelector(".mark").innerHTML = svg;
      }).catch(() => {});
      clickOpensDetails(n);
      return n;
    };

    // The Pulse family card was removed when Pulse itself shipped: a card
    // advertising six siblings is wrong when four of them merged into one.
    // Featured now carries three flagships.

    for (const n of [solo("nixfred.infomarchy", "flagship"), solo("nixfred.blip", "flagship"), solo("nixfred.pulse", "flagship")]) {
      if (n) grid.append(n);
    }
  }

  function chrome() {
    const s = DATA.stats;
    $("#stats").innerHTML = [
      [s.plugins, "plugins"], [s.families, "families"],
      [s.stars.toLocaleString(), "stars"],
      [`${s.listed}/${s.live}`, "listed"],
      [s.themes, "theme"],
    ].map(([n, l], i) => `<div class="stat${i === 0 ? " hl" : ""}"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("");

    const chips = $("#chips");
    const mk = (id, label, n) => {
      const b = el("button", "chip", `${esc(label)} <span class="n">${n}</span>`);
      b.type = "button"; b.dataset.fam = id;
      b.addEventListener("click", () => { state.fam = id; render(); });
      chips.append(b);
    };
    mk("all", "All", DATA.plugins.length);
    for (const f of DATA.families) mk(f.id, f.name.replace(/^The /, ""), DATA.plugins.filter((p) => p.family === f.id).length);

    $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });

    heroFeature();
    featured();

    // themes
    $("#theme-count").textContent = DATA.themes.length;
    $("#theme-grid").innerHTML =
      DATA.themes.map((t) => `
        <article class="theme-card">
          <img src="assets/img/theme/${esc(t.id)}.jpg" alt="${esc(t.name)} theme preview" loading="lazy"
               onerror="this.style.display='none'">
          <div class="body">
            <h3>${esc(t.name)}</h3>
            <div class="tagline" style="color:var(--fg-3);font-size:13px;margin-top:4px">${esc(t.tagline)}</div>
            <p class="desc" style="margin:11px 0 0">${esc(t.description)}</p>
            <div class="swatches">${["#0d1b2a", "#1b263b", "#415a77", "#778da9", "#e0e1dd"].map((c) => `<i style="background:${c}"></i>`).join("")}</div>
            <div class="foot" style="margin-top:15px">
              <a class="btn" href="${esc(t.repo_url)}" target="_blank" rel="noopener">${ICON.github} Source</a>
            </div>
            <!-- Install clones AND applies - omarchy-theme-install ends by
                 calling omarchy-theme-set, so there is no enable step to run.
                 Set is the way back to it once you have wandered off. -->
            <div class="cmds" style="margin-top:14px">
              ${cmdBox("Install", t.install)}
              ${cmdBox("Set", t.set)}
            </div>
          </div>
        </article>`).join("") +
      `<div class="slot">room for the next theme</div><div class="slot">room for the next theme</div>`;

    // Tools. They were a row of text links at the foot of the page and nobody
    // reached them, so they are full cards now, in the featured shape, directly
    // under the flagships.
    $("#tool-count").textContent = DATA.tools.length;
    $("#tool-grid").innerHTML = "";
    for (const t of DATA.tools) {
      const n = el("article", "feat tool");
      n.innerHTML = `
        <div class="kicker">tool</div>
        <h3>${esc(t.name)}</h3>
        ${t.shot ? `<img class="shot" src="${esc(t.shot)}" alt="${esc(t.name)}" loading="lazy" decoding="async">` : ""}
        <p class="d">${esc(t.description)}</p>
        <div class="tags">${statusTags(t)}</div>
        <div class="foot">
          <a class="btn primary" href="${esc(t.repo_url)}" target="_blank" rel="noopener">${ICON.github} Source</a>
        </div>
        ${detailsBlock(t)}`;
      clickOpensDetails(n);
      $("#tool-grid").append(n);
    }

    // retired
    $("#retired-count").textContent = DATA.retired.length;
    $("#retired-grid").innerHTML = DATA.retired.map((r) => {
      const body = `<div class="g"><b>${esc(r.name)}</b><p>${esc(r.reason)}</p></div>`;
      return r.repo_url
        ? `<a class="row" style="opacity:.66" href="${esc(r.repo_url)}" target="_blank" rel="noopener">${body}</a>`
        : `<div class="row" style="opacity:.66">${body}</div>`;
    }).join("");

    // heatmap
    if (DATA.heatmap) {
      $("#heat-total").textContent = `${DATA.heatmap.total.toLocaleString()} contributions in the last year. The plugins above are what most of it went into.`;
      $("#heat").innerHTML = DATA.heatmap.weeks.map((w) =>
        `<div class="wk">${w.map((d) => `<i data-l="${d.level}" title="${d.date}: ${d.count}"></i>`).join("")}</div>`).join("");
    } else {
      $("#activity").style.display = "none";
    }

    $("#built").textContent = `generated ${new Date(DATA.generated_at).toISOString().slice(0, 16).replace("T", " ")} UTC · listing status read live from the official registry`;
  }

  // One listener for every copy box on the page, present and future, so cards
  // rendered later by a filter do not need re-wiring.
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest?.("[data-cmd]");
    if (!btn) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(btn.dataset.cmd);
      const prev = btn.innerHTML;
      btn.classList.add("done");
      btn.innerHTML = `<code>copied</code>${ICON.check}`;
      setTimeout(() => { btn.classList.remove("done"); btn.innerHTML = prev; }, 1400);
    } catch { /* clipboard blocked, leave the text visible to select by hand */ }
  });

  // The genuine Omarchy wordmark is inlined rather than used as <img>, because
  // an <img> cannot inherit currentColor and the file ships filled with black.
  fetch("assets/img/omarchy-wordmark.svg")
    .then((r) => (r.ok ? r.text() : null))
    .then((svg) => { if (svg) $("#oma-mark").innerHTML = svg; })
    .catch(() => { $("#oma-mark").textContent = "OMARCHY"; });

  fetch("data.json")
    .then((r) => r.json())
    .then((d) => {
      DATA = d;
      chrome();
      render();
      animateBar(buildBar());
      window.__appReady = true;
    })
    .catch((e) => {
      window.__appDataFailed = e.message;
      $("#families").innerHTML = `<div class="wrap"><div class="slot">Could not load data.json — ${esc(e.message)}</div></div>`;
    });
})();
