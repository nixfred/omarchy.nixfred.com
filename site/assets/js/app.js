/* omarchy.nixfred.com — renders everything from data.json */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ICON = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18l-1.5 11H4.5L3 9Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z"/></svg>',
    arrow: '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    dotm: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="4"/></svg>',
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8ZM12 17v5"/></svg>',
  };

  // Widgets that live in the hero bar. type drives the animation.
  const BAR = [
    { id: "larry.status", type: "dot", label: "larry" },
    { id: "nixfred.workspace-names", type: "text", label: "3 · build" },
    { id: "nixfred.cpu-pulse", type: "bars", n: 8, label: "cpu" },
    { id: "nixfred.ram-pulse", type: "bars", n: 6, label: "ram" },
    { id: "nixfred.disk-pulse", type: "ring", label: "ssd" },
    { id: "nixfred.net-pulse", type: "spark", label: "net" },
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

      n.addEventListener("click", () => {
        const card = document.getElementById(`p-${p.id}`);
        if (!card) return;
        state.q = ""; state.fam = "all"; $("#q").value = ""; render();
        requestAnimationFrame(() => {
          document.getElementById(`p-${p.id}`)?.scrollIntoView({ block: "center" });
          const c = document.getElementById(`p-${p.id}`);
          if (c) { c.style.borderColor = p.accent; setTimeout(() => (c.style.borderColor = ""), 1400); }
        });
      });
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
      <div class="foot">
        ${p.install ? `<button class="btn copy" type="button" data-cmd="${esc(p.install)}" title="Copy: ${esc(p.install)}"><span class="cmd">${esc(p.repo)}</span>${ICON.copy}</button>` : ""}
        ${links.join("")}
      </div>`;

    // Swap in the real glyph when Codex's SVG exists; the plug icon is the fallback.
    const holder = c.querySelector(".glyph");
    fetch(p.glyph).then((r) => (r.ok ? r.text() : null)).then((svg) => {
      if (svg && svg.trim().startsWith("<svg")) holder.innerHTML = svg;
    }).catch(() => {});

    const btn = c.querySelector(".copy");
    if (btn) btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.cmd);
        const prev = btn.innerHTML;
        btn.classList.add("done");
        btn.innerHTML = `<span class="cmd">copied</span>${ICON.check}`;
        setTimeout(() => { btn.classList.remove("done"); btn.innerHTML = prev; }, 1400);
      } catch { /* clipboard blocked */ }
    });
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

  /** The hero's right half: one real plugin card, switchable between the three
      featured entries, clicking straight through to the plugin itself. */
  function heroFeature() {
    const byId = new Map(DATA.plugins.map((p) => [p.id, p]));
    const pulse = DATA.plugins.filter((p) => p.family === "pulse");

    const picks = [
      { key: "infomarchy", label: "Infomarchy", id: "nixfred.infomarchy" },
      { key: "blip", label: "Blip", id: "nixfred.blip" },
      { key: "pulse", label: "Pulse ×" + pulse.length, family: true, accent: "#4aa8ff" },
    ].filter((k) => k.family || byId.has(k.id));

    const host = $("#hero-feature");
    const bar = $("#hero-pickers");

    const inlineSvg = (node, url) =>
      fetch(url).then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) node.innerHTML = svg;
      }).catch(() => {});

    function draw(pick) {
      host.textContent = "";
      const a = el("a", "hero-card");

      if (pick.family) {
        const stars = pulse.reduce((n, p) => n + p.stars, 0);
        a.href = "#f-pulse";
        a.style.setProperty("--ca", pick.accent);
        a.innerHTML = `
          <div class="row1">
            <span class="mark" id="hero-mark">${ICON.plug}</span>
            <div>
              <h3>The Pulse Suite</h3>
              <div class="tagline">One visual language for the whole machine.</div>
            </div>
          </div>
          <p class="d">RAM, CPU, Net, Disk, Audio and Power, drawn as ${pulse.length} siblings of the
             same living silicon. Learn one and you have learned all six.</p>
          <div class="siblings">${pulse.map((p) =>
            `<span title="${esc(p.name)}" style="color:${esc(p.accent)}" data-g="${esc(p.glyph)}">${ICON.plug}</span>`).join("")}</div>
          <div class="tags">
            <span class="tag stars">${ICON.star} ${stars}</span>
            <span class="tag">${pulse.filter((p) => p.listed).length}/${pulse.length} listed</span>
          </div>
          <span class="go">See all six ${ICON.arrow}</span>`;
        inlineSvg(a.querySelector("#hero-mark"), "assets/img/family/pulse.svg");
      } else {
        const p = byId.get(pick.id);
        a.href = p.repo_url || `#p-${p.id}`;
        if (p.repo_url) { a.target = "_blank"; a.rel = "noopener"; }
        a.style.setProperty("--ca", p.accent);
        a.innerHTML = `
          <div class="row1">
            <span class="mark" id="hero-mark">${ICON.plug}</span>
            <div>
              <h3>${esc(p.name)} <span class="ver">v${esc(p.version)}</span></h3>
              <div class="tagline">${esc(p.tagline)}</div>
            </div>
          </div>
          <p class="d">${esc(p.description)}</p>
          <div class="tags">${statusTags(p)}</div>
          <span class="go">Open the source ${ICON.arrow}</span>`;
        inlineSvg(a.querySelector("#hero-mark"), p.glyph);
      }

      for (const n of a.querySelectorAll("[data-g]")) inlineSvg(n, n.dataset.g);
      host.append(a);

      for (const b of bar.children) b.setAttribute("aria-selected", String(b.dataset.key === pick.key));
    }

    for (const pick of picks) {
      const b = el("button", null, esc(pick.label));
      b.type = "button";
      b.dataset.key = pick.key;
      b.setAttribute("role", "tab");
      const accent = pick.family ? pick.accent : byId.get(pick.id).accent;
      b.style.setProperty("--pa", accent);
      b.addEventListener("click", () => draw(pick));
      bar.append(b);
    }
    draw(picks[0]);
  }

  /** Two flagships and the six-strong Pulse family, above the catalogue. */
  function featured() {
    const byId = new Map(DATA.plugins.map((p) => [p.id, p]));
    const grid = $("#feat-grid");
    const pulse = DATA.plugins.filter((p) => p.family === "pulse");

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
        <p class="d">${esc(p.description)}</p>
        <div class="tags">${statusTags(p)}</div>
        <div class="foot">
          <a class="btn primary" href="#p-${esc(p.id)}">Details</a>
          ${p.repo_url ? `<a class="btn" href="${esc(p.repo_url)}" target="_blank" rel="noopener">${ICON.github} Source</a>` : ""}
        </div>`;
      fetch(p.glyph).then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) n.querySelector(".mark").innerHTML = svg;
      }).catch(() => {});
      return n;
    };

    const family = () => {
      const n = el("article", "feat");
      n.style.setProperty("--ca", "#4aa8ff");
      const stars = pulse.reduce((a, p) => a + p.stars, 0);
      n.innerHTML = `
        <div class="kicker">the family</div>
        <div class="mark" id="feat-pulse-mark">${ICON.plug}</div>
        <h3>The Pulse Suite <span class="ver">${pulse.length}</span></h3>
        <div class="tagline">One visual language for the whole machine.</div>
        <p class="d">RAM, CPU, Net, Disk, Audio and Power, drawn as six siblings of the same
           living silicon. Each one is a chip die with continuous history, pressure, and the
           processes actually responsible. Learn one and you have learned all six.</p>
        <div class="siblings">${pulse.map((p) =>
          `<a href="#p-${esc(p.id)}" title="${esc(p.name)}" style="color:${esc(p.accent)}" data-g="${esc(p.glyph)}">${ICON.plug}</a>`).join("")}</div>
        <div class="tags">
          <span class="tag stars">${ICON.star} ${stars}</span>
          <span class="tag">${pulse.filter((p) => p.listed).length}/${pulse.length} listed</span>
        </div>
        <div class="foot"><a class="btn primary" href="#f-pulse">See all six</a></div>`;
      // real glyphs, once fetched
      for (const a of n.querySelectorAll("[data-g]")) {
        fetch(a.dataset.g).then((r) => (r.ok ? r.text() : null)).then((svg) => {
          if (svg && svg.trim().startsWith("<svg")) a.innerHTML = svg;
        }).catch(() => {});
      }
      const mark = n.querySelector("#feat-pulse-mark");
      fetch("assets/img/family/pulse.svg").then((r) => (r.ok ? r.text() : null)).then((svg) => {
        if (svg && svg.trim().startsWith("<svg")) mark.innerHTML = svg;
      }).catch(() => {});
      return n;
    };

    for (const n of [solo("nixfred.infomarchy", "flagship"), solo("nixfred.blip", "flagship"), family()]) {
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
          </div>
        </article>`).join("") +
      `<div class="slot">room for the next theme</div><div class="slot">room for the next theme</div>`;

    // tools
    $("#tool-count").textContent = DATA.tools.length;
    $("#tool-grid").innerHTML = DATA.tools.map((t) => `
      <a class="row" href="${esc(t.repo_url)}" target="_blank" rel="noopener">
        <div class="g"><b>${esc(t.name)}</b>${t.stars ? ` <span class="tag stars" style="border:0;padding:0">${ICON.star} ${t.stars}</span>` : ""}
        <p>${esc(t.description)}</p></div>
      </a>`).join("");

    // retired
    $("#retired-count").textContent = DATA.retired.length;
    $("#retired-grid").innerHTML = DATA.retired.map((r) => `
      <div class="row" style="opacity:.66">
        <div class="g"><b>${esc(r.name)}</b><p>${esc(r.reason)}</p></div>
      </div>`).join("");

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
    })
    .catch((e) => {
      $("#families").innerHTML = `<div class="wrap"><div class="slot">Could not load data.json — ${esc(e.message)}</div></div>`;
    });
})();
