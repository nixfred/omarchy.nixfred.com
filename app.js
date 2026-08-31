/* nixfred.com — desktop-shell demo. Local review build, no dependencies. */
"use strict";

/* ============================== DATA ============================== */

const THEMES = [
  { id:"tokyo-night", name:"Tokyo Night", mode:"dark", accent:"#7aa2f7", background:"#1a1b26", darkBackground:"#13141c", darkerBackground:"#0e0e14", lighterBackground:"#24283b", foreground:"#a9b1d6", muted:"#414868", bright:"#c0caf5", cyan:"#449dab", orange:"#eb927b", green:"#9ece6a" },
  { id:"gruvbox", name:"Gruvbox", mode:"dark", accent:"#7daea3", background:"#282828", darkBackground:"#1e1e1e", darkerBackground:"#161616", lighterBackground:"#3c3836", foreground:"#d4be98", muted:"#665c54", bright:"#d4be98", cyan:"#89b482", orange:"#e1875c", green:"#a9b665" },
  { id:"nord", name:"Nord", mode:"dark", accent:"#81a1c1", background:"#2e3440", darkBackground:"#222730", darkerBackground:"#191c23", lighterBackground:"#3b4252", foreground:"#d8dee9", muted:"#4c566a", bright:"#d8dee9", cyan:"#88c0d0", orange:"#d5967a", green:"#a3be8c" },
  { id:"matte-black", name:"Matte Black", mode:"dark", accent:"#e68e0d", background:"#121212", darkBackground:"#0d0d0d", darkerBackground:"#090909", lighterBackground:"#1e1e1e", foreground:"#bebebe", muted:"#333333", bright:"#d8d8d8", cyan:"#bebebe", orange:"#c63d3d", green:"#ffc107" },
  { id:"everforest", name:"Everforest", mode:"dark", accent:"#7fbbb3", background:"#2d353b", darkBackground:"#21272c", darkerBackground:"#181d20", lighterBackground:"#343f44", foreground:"#d3c6aa", muted:"#475258", bright:"#d3c6aa", cyan:"#83c092", orange:"#e09d7f", green:"#a7c080" },
  { id:"kanagawa", name:"Kanagawa", mode:"dark", accent:"#dcd7ba", background:"#1f1f28", darkBackground:"#17171e", darkerBackground:"#111116", lighterBackground:"#223249", foreground:"#dcd7ba", muted:"#54546d", bright:"#dcd7ba", cyan:"#6a9589", orange:"#c17158", green:"#76946a" },
  { id:"rose-pine", name:"Rosé Pine", mode:"light", accent:"#56949f", background:"#faf4ed", darkBackground:"#ede7e1", darkerBackground:"#e1dbd5", lighterBackground:"#f2e9e1", foreground:"#575279", muted:"#cecacd", bright:"#575279", cyan:"#d7827e", orange:"#cf8057", green:"#286983" },
  { id:"catppuccin", name:"Catppuccin", mode:"dark", accent:"#89b4fa", background:"#1e1e2e", darkBackground:"#161622", darkerBackground:"#101019", lighterBackground:"#313244", foreground:"#cdd6f4", muted:"#585b70", bright:"#cdd6f4", cyan:"#94e2d5", orange:"#f6b6ab", green:"#a6e3a1" },
];

const HERO_COPY = {
  "tokyo-night": { eyebrow:"AI Infrastructure · Atlanta GA", lead:"One human. One AI.", follow:"A fleet that builds itself." },
  "gruvbox":     { eyebrow:"Warm metal · sharp tools", lead:"Everything here shipped.", follow:"Most of it this month." },
  "nord":        { eyebrow:"Stable underneath · alive on top", lead:"The base stays boring.", follow:"The work stays interesting." },
  "matte-black": { eyebrow:"No dock · no clutter", lead:"Just the fleet.", follow:"And the terminal." },
  "everforest":  { eyebrow:"Grown, not assembled", lead:"Systems that compound.", follow:"Memory that survives." },
  "kanagawa":    { eyebrow:"Coherence without captivity", lead:"Opinionated defaults.", follow:"Personal everything." },
  "rose-pine":   { eyebrow:"Daylight mode", lead:"Same fleet.", follow:"Softer light." },
  "catppuccin":  { eyebrow:"A coherent place to begin", lead:"Built in public.", follow:"Lived in private." },
};

const WORKSPACES = [
  { id:"home",    n:"1", title:"Welcome", short:"Home",    desc:"Fred Nix — AI Infrastructure Architect. One human, one AI, one fleet." },
  { id:"cards",   n:"2", title:"The Cards", short:"Cards", desc:"Twelve shipped projects. Plugins, bridges, daemons, and one persistent AI." },
  { id:"writing", n:"3", title:"Writing", short:"Writing", desc:"Field notes on running a human + AI engineering practice." },
  { id:"fleet",   n:"4", title:"The Fleet", short:"Fleet", desc:"The machines. What they run, what they're for, who talks to whom." },
];

const CARDS = [
  { name:"Larry", glyph:"λ", tone:"blue", status:"always on",
    pitch:"A persistent AI engineering collaborator with six months of memory, 16 constitutional laws, and opinions.",
    meta:"PAI · TypeScript · hooks + skills", link:null, linkLabel:"lives on the fleet" },
  { name:"Blip", glyph:"✉", tone:"green", status:"public",
    pitch:"iMessage on Linux. Sends and receives through a Mac over multiplexed SSH in 47ms — blue bubbles from Arch.",
    meta:"TypeScript · Bun · systemd", link:"https://github.com/nixfred/blip", linkLabel:"nixfred/blip" },
  { name:"Swish", glyph:"⌘", tone:"orange", status:"public",
    pitch:"Mac Cmd+Tab muscle memory on Hyprland: workspace groups, live previews, Esc to bail out.",
    meta:"Rust · patched hyprshell", link:"https://github.com/nixfred/swish", linkLabel:"nixfred/swish" },
  { name:"Plonk", glyph:"⇲", tone:"cyan", status:"public · PR upstream",
    pitch:"Workspace compactor for Omarchy. Close the gaps like they were never there — manual or daemon mode.",
    meta:"Shell · socat · omarchy#7727", link:"https://github.com/nixfred/plonk", linkLabel:"nixfred/plonk" },
  { name:"Infomarchy", glyph:"◱", tone:"blue", status:"public",
    pitch:"Your wallpaper, but it knows things. A live info desk drawn behind every window, one keystroke away.",
    meta:"QML · Quickshell · Bun collector", link:"https://github.com/nixfred/infomarchy", linkLabel:"nixfred/infomarchy" },
  { name:"Workspace Names", glyph:"№", tone:"green", status:"public",
    pitch:"Workspaces with names, not numbers. Hover the bar, click, type — the title slides in and stays.",
    meta:"QML · Omarchy plugin", link:"https://github.com/nixfred/workspace-names", linkLabel:"nixfred/workspace-names" },
  { name:"Rift", glyph:"⋔", tone:"orange", status:"public",
    pitch:"An Omarchy bar plugin built to be forked. Shipped, installed live, iterated in public.",
    meta:"QML · Omarchy plugin", link:"https://github.com/nixfred/rift", linkLabel:"nixfred/rift" },
  { name:"clipsync", glyph:"⇄", tone:"cyan", status:"fleet service",
    pitch:"Copy on the Mac, paste on Arch. Bidirectional clipboard sync — text and images — over Blip's SSH mux.",
    meta:"Bash · systemd · osascript", link:null, linkLabel:"vic ⇄ fnix" },
  { name:"larry.status", glyph:"◉", tone:"blue", status:"fleet widget",
    pitch:"Every AI session on the machine, in the bar, with a face. CyberFace moods track what the agents are doing.",
    meta:"QML · TypeScript collector", link:null, linkLabel:"agents on deck" },
  { name:"cfdns", glyph:"⌁", tone:"green", status:"daily driver",
    pitch:"Cloudflare DNS for 20 zones from one command. The dashboard tab, retired.",
    meta:"Bash · Cloudflare API", link:null, linkLabel:"~/bin/cfdns" },
  { name:"Fleet Command", glyph:"⌂", tone:"orange", status:"infrastructure",
    pitch:"Eleven Linux hosts watched from one panel — status, storage, sync, and a heartbeat watchdog.",
    meta:"Omarchy plugins · rclone · SSH", link:null, linkLabel:"nix fleet command" },
  { name:"Omarchy upstream", glyph:"↗", tone:"cyan", status:"contributing",
    pitch:"Patches sent home: time-exact year progress, workspace compaction, fixes riding every release.",
    meta:"PRs #7727 · #8653", link:"https://github.com/basecamp/omarchy", linkLabel:"basecamp/omarchy" },
];

const SCENARIOS = [
  { id:"clipsync", request:"Sync my clipboard between the Mac and this Arch laptop.",
    steps:["probe fnix over ssh mux","wire wl-copy ⇄ pbcopy","handle PNG both directions","enable clipsync.service"],
    addon:"clipsync · live", result:"ready · copy there, paste here · 47ms" },
  { id:"blip", request:"Let me send iMessages from Linux.",
    steps:["borrow the Mac's Messages.app","multiplex ssh · 47ms round trip","mirror threads + read marks","pin blip to the bar"],
    addon:"✉ blip · 3 threads", result:"ready · blue bubbles from Arch" },
  { id:"upstream", request:"Watch upstream Omarchy and tell me what changed.",
    steps:["compare last sha → quattro","flag files we patched","write UPSTREAM-WATCH.md","toast if anything moved"],
    addon:"upstream · 2 flagged", result:"ready · daily at 08:30 · nothing broke" },
  { id:"swish", request:"Give me Mac Cmd+Tab on Hyprland.",
    steps:["patch hyprshell for groups","add live window previews","make Esc restore focus","package as hyprshell-swish"],
    addon:"⌘ swish · armed", result:"ready · your thumbs never left Cupertino" },
  { id:"status", request:"Put my AI sessions in the bar with a face.",
    steps:["collect claude + codex sessions","map moods to CyberFace","bind 1-9 to jump focus","ship larry.status v0.3"],
    addon:"◉ 4 agents on deck", result:"ready · the face is watching the agents" },
  { id:"plonk", request:"Compact my workspaces like I never left.",
    steps:["read the workspace map","plan the shortest moves","slide windows left","bind super + minus"],
    addon:"⇲ plonk · tidy", result:"ready · gaps closed · nothing lost" },
];

const DOCS = [
  { id:"one-human-one-ai", title:"One human, one AI", trail:"01",
    body:[
      ["p","The pitch is simple: a single engineer, paired with a persistent AI that remembers everything, can run infrastructure that used to take a team. Not because the AI is magic — because the memory compounds."],
      ["h2","The shape of it"],
      ["p","Larry lives in the terminal. Every session is preserved, extracted, and indexed. Decisions get logged once and never re-litigated. Error patterns become lookup tables. The second time any problem appears, it's already solved."],
      ["p","The human sets direction, taste, and the constitution. The AI does the recall, the plumbing, and the 2 a.m. refactors. Neither is optional."],
      ["h2","What it produces"],
      ["p","Everything on the Cards workspace was built this way — plugins, bridges, daemons, DNS tooling. The site you're reading is the same story: designed together, shipped from the same terminal."],
    ]},
  { id:"the-fleet", title:"Running the fleet", trail:"02",
    body:[
      ["p","Five machines matter day to day: an Arch laptop on the desk, a MacBook that anchors the Apple side, a cloud box for memory ingestion, and small hosts doing one job each. Eleven show up in the panel."],
      ["h2","Rules of the road"],
      ["p","Every box is disposable except its git repos. Configuration lives in version control, secrets live in one place, and anything that broke once gets a watchdog. Backups run nightly and restores get rehearsed, because a backup you've never restored is a rumor."],
      ["h2","The bridges"],
      ["p","The interesting work is in the seams: clipboard sync between macOS and Wayland, iMessage over SSH, one clipboard, one DNS tool, one status bar that sees everything. The fleet feels like one computer wearing five bodies."],
    ]},
  { id:"building-on-omarchy", title:"Building on Omarchy", trail:"03",
    body:[
      ["p","Omarchy ships an opinionated Arch + Hyprland + Quickshell desktop. The opinions are good, and — more important — the seams are real: plugins, themes, and a user layer that survives every upgrade."],
      ["h2","The plugin habit"],
      ["p","Six plugins shipped so far: named workspaces, a live info wallpaper, workspace compaction, a status face for AI agents, and more. The pattern is always the same — clone a stock component, patch it out of tree, hot-reload, and send the good parts upstream."],
      ["h2","Why bother"],
      ["p","Because the desktop is the cockpit. Every minute the bar shows the right thing, or a keybinding lands where thumbs expect it, is a minute of attention returned to the actual work."],
    ]},
];

const FLEET = [
  { host:"vic",  role:"primary cockpit", spec:"Arch · Hyprland · RTX 4050", detail:"Omarchy desktop, Larry instance, plugin dev, DNS + fleet tooling", status:"online", tone:"blue" },
  { host:"fnix", role:"apple anchor", spec:"MacBook Pro · M4 Max", detail:"Larry prime, iMessage gateway, clipboard peer, OSINT skills", status:"online", tone:"green" },
  { host:"blu",  role:"memory engine", spec:"cloud VPS · 4 vCPU", detail:"Memory ingestion, Library of Alexandria, semantic recall", status:"online", tone:"cyan" },
  { host:"nano", role:"utility node", spec:"small metal · one job", detail:"Whatever needs a heartbeat and a static IP this month", status:"online", tone:"orange" },
  { host:"L40S", role:"gpu muscle", spec:"remote · 48GB VRAM", detail:"Local-model heavy lifting when the laptop's 6GB won't cut it", status:"on call", tone:"blue" },
];

/* ============================== STATE ============================== */

const THEME_INTERVAL = 20000;
const AGENT_DWELL = 12000;

const state = {
  workspace: "home",
  themeIndex: 0,
  themePaused: false,
  themeEpoch: 0,
  agent: { index: 0, phase: "typing", typed: 0, steps: 0 },
  palette: { open: false, query: "", selected: 0 },
};

const $ = (id) => document.getElementById(id);
const shell = $("shell");

/* ============================== THEME ============================== */

function applyTheme() {
  const t = THEMES[state.themeIndex];
  const s = shell.style;
  s.setProperty("--canvas", t.background);
  s.setProperty("--surface", t.darkBackground);
  s.setProperty("--surface-raised", t.lighterBackground);
  s.setProperty("--surface-soft", t.darkerBackground);
  s.setProperty("--border", t.muted);
  s.setProperty("--border-soft", `color-mix(in srgb, ${t.muted} 58%, transparent)`);
  s.setProperty("--text", t.foreground);
  s.setProperty("--muted", `color-mix(in srgb, ${t.foreground} 58%, ${t.background})`);
  s.setProperty("--bright", t.bright);
  s.setProperty("--blue", t.accent);
  s.setProperty("--cyan", t.cyan);
  s.setProperty("--green", t.green);
  s.setProperty("--orange", t.orange);
  s.setProperty("--accent-contrast", t.mode === "dark" ? "#0a0b10" : "#ffffff");
  s.setProperty("--wallpaper-scrim", t.mode === "dark"
    ? "linear-gradient(120deg, rgb(4 5 9 / 52%), rgb(4 5 9 / 20%) 55%, rgb(4 5 9 / 44%))"
    : "linear-gradient(120deg, rgb(255 255 255 / 34%), rgb(255 255 255 / 10%) 55%, rgb(255 255 255 / 28%))");
  shell.dataset.themeMode = t.mode;

  document.querySelectorAll(".wallpaper-frame").forEach((el, i) =>
    el.classList.toggle("active", i === state.themeIndex));

  $("theme-name").textContent = t.name;
  $("theme-count").textContent = `${state.themeIndex + 1}/${THEMES.length}`;
  const bar = $("theme-progress");
  bar.style.animation = "none";
  void bar.offsetWidth;
  bar.style.animation = state.themePaused ? "none" : `theme-progress ${THEME_INTERVAL}ms linear`;

  // per-theme hero copy
  const copy = HERO_COPY[t.id];
  const eyebrow = document.querySelector(".hero-content .eyebrow");
  if (eyebrow && copy) {
    eyebrow.textContent = copy.eyebrow;
    const spans = document.querySelectorAll(".hero-content h1 span");
    if (spans.length === 2) { spans[0].textContent = copy.lead; spans[1].textContent = copy.follow; }
  }
}

function setTheme(i) {
  state.themeIndex = (i + THEMES.length) % THEMES.length;
  state.themeEpoch++;
  applyTheme();
  scheduleThemeTimer();
}

let themeTimer = null;
function scheduleThemeTimer() {
  clearTimeout(themeTimer);
  if (state.themePaused) return;
  themeTimer = setTimeout(() => setTheme(state.themeIndex + 1), THEME_INTERVAL);
}

/* ============================== AGENT ============================== */

let agentTimer = null;
function agentTick() {
  const a = state.agent;
  const sc = SCENARIOS[a.index];
  let delay;
  if (a.phase === "typing" && a.typed < sc.request.length) { a.typed++; delay = 42; }
  else if (a.phase === "typing") { a.phase = "working"; a.steps = 0; delay = 700; }
  else if (a.phase === "working" && a.steps < sc.steps.length) { a.steps++; delay = 820; }
  else if (a.phase === "working") { a.phase = "done"; delay = AGENT_DWELL; }
  else { state.agent = { index: (a.index + 1) % SCENARIOS.length, phase: "typing", typed: 0, steps: 0 }; delay = 60; }
  renderAgent();
  agentTimer = setTimeout(agentTick, delay);
}

function renderAgent() {
  const a = state.agent;
  const sc = SCENARIOS[a.index];
  shell.dataset.agentPhase = a.phase;

  const typedEl = $("agent-typed");
  if (typedEl) {
    typedEl.textContent = sc.request.slice(0, a.typed);
    $("agent-count").textContent = `${String(a.index + 1).padStart(2, "0")}/${String(SCENARIOS.length).padStart(2, "0")}`;
    const stepsEl = $("agent-steps");
    let html = "";
    for (let i = 0; i < a.steps; i++) {
      const last = i === a.steps - 1 && a.phase === "working";
      html += `<p class="${last ? "current" : "done"}"><i></i>${esc(sc.steps[i])}</p>`;
    }
    if (a.phase === "done") html += `<p class="result">${esc(sc.result)}</p>`;
    stepsEl.innerHTML = html;
  }

  const addon = $("panel-addon");
  addon.hidden = a.phase !== "done";
  if (a.phase === "done") addon.textContent = sc.addon;
}

/* ============================== RENDER ============================== */

function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])); }

function windowEl(tone, cls, label, inner) {
  return `<section class="app-window tone-${tone} ${cls}" aria-label="${esc(label)}"><div class="window-body">${inner}</div></section>`;
}

function renderHome() {
  const copy = HERO_COPY[THEMES[state.themeIndex].id];
  const hero = windowEl("blue", "hero-window", "Welcome · ~/fred", `
    <div class="hero-content">
      <div class="headline-copy">
        <p class="eyebrow">${esc(copy.eyebrow)}</p>
        <h1><span>${esc(copy.lead)}</span><span>${esc(copy.follow)}</span></h1>
      </div>
      <p class="hero-manifesto">Fred Nix builds AI infrastructure in Atlanta: a five-body fleet, a dozen shipped tools, and a persistent AI named Larry who remembers all of it.</p>
      <div class="hero-actions">
        <button class="action primary" data-goto="cards">See the cards</button>
        <a class="action secondary" href="https://github.com/nixfred" target="_blank" rel="noreferrer">github.com/nixfred ↗</a>
      </div>
      <div class="hero-footnotes">
        <span><b>01</b> 12 curated projects</span>
        <span><b>02</b> 5-body fleet</span>
        <span><b>03</b> one persistent AI</span>
      </div>
    </div>
    <div class="hero-glyph" aria-hidden="true"><span>λ</span></div>`);

  const term = windowEl("green", "terminal-window", "Terminal · larry", `
    <div class="agent-terminal">
      <div class="tile-label"><span><i class="status-light"></i> larry — live demo</span><b>real requests · <span id="agent-count">01/06</span></b></div>
      <div class="agent-session">
        <p class="agent-prompt"><span aria-hidden="true">›</span><span id="agent-typed"></span><span class="cursor" aria-hidden="true"></span></p>
        <div class="agent-steps" id="agent-steps"></div>
      </div>
    </div>`);

  const stack = windowEl("orange", "system-window", "System · stack", `
    <div class="system-stack">
      <div class="tile-label"><span>system stack</span><b class="stack-status"><i></i>watching</b></div>
      <dl class="system-layers">
        <div><dt><em>01</em><span>Base</span></dt><dd>Arch + Omarchy</dd></div>
        <div><dt><em>02</em><span>Shell</span></dt><dd>Hyprland + Quickshell</dd></div>
        <div><dt><em>03</em><span>AI layer</span></dt><dd>PAI · Larry</dd></div>
        <div><dt><em>04</em><span>Plugins</span></dt><dd>6 shipped · 2 upstream PRs</dd></div>
        <div><dt><em>05</em><span>Fleet</span></dt><dd>vic · fnix · blu · nano · L40S</dd></div>
        <div><dt><em>06</em><span>Memory</span></dt><dd>everything, since day one</dd></div>
      </dl>
      <div class="stack-receipt"><span>the machines change</span><b>The memory doesn't.</b></div>
    </div>`);

  return `<div class="workspace-grid home-grid">${hero}<div class="utility-stack">${term}${stack}</div></div>`;
}

function renderCards() {
  const intro = windowEl("blue", "cards-intro", "The Cards", `
    <div class="cards-intro-content">
      <p class="eyebrow">Twelve, curated</p>
      <h1>Shipped beats planned.</h1>
      <p>Plugins for the desktop, bridges between worlds, daemons that never sleep — and the AI that co-wrote all of it. Every card is real, running, and in use today.</p>
    </div>`);
  const cards = CARDS.map((c, i) => `
    <article class="app-window tone-${c.tone} project-card" style="--card-i:${i}">
      <div class="window-body">
        <header class="tile-label"><span><i class="card-glyph">${c.glyph}</i> ${esc(c.name)}</span><b>${esc(c.status)}</b></header>
        <p class="card-pitch">${esc(c.pitch)}</p>
        <footer class="card-meta"><span>${esc(c.meta)}</span>${
          c.link ? `<a href="${c.link}" target="_blank" rel="noreferrer">${esc(c.linkLabel)} ↗</a>`
                 : `<b>${esc(c.linkLabel)}</b>`}</footer>
      </div>
    </article>`).join("");
  return `<div class="workspace-grid cards-grid">${intro}${cards}</div>`;
}

function renderWriting(activeId) {
  const doc = DOCS.find((d) => d.id === activeId) || DOCS[0];
  const nav = DOCS.map((d) => `
    <button class="doc-link ${d.id === doc.id ? "active" : ""}" data-doc="${d.id}">
      <em>${d.trail}</em><span>${esc(d.title)}</span>
    </button>`).join("");
  const body = doc.body.map(([tag, text]) => `<${tag}>${esc(text)}</${tag}>`).join("");
  const index = windowEl("cyan", "doc-index", "Writing · index", `
    <div class="tile-label"><span>~/writing</span><b>${DOCS.length} notes</b></div>
    <nav class="doc-nav">${nav}</nav>`);
  const reader = windowEl("blue", "doc-reader", `Writing · ${doc.title}`, `
    <div class="tile-label"><span>${esc(doc.title)}</span><b>${doc.trail}/0${DOCS.length}</b></div>
    <div class="markdown-document"><h1>${esc(doc.title)}</h1>${body}</div>`);
  return `<div class="workspace-grid writing-grid">${index}${reader}</div>`;
}

function renderFleet() {
  const intro = windowEl("orange", "fleet-intro", "Fleet · overview", `
    <div class="cards-intro-content">
      <p class="eyebrow">Static snapshot · regenerated by cron on vic</p>
      <h1>One computer, five bodies.</h1>
      <p>Every host is disposable except its repos. Everything that broke once has a watchdog now.</p>
    </div>`);
  const hosts = FLEET.map((h) => `
    <article class="app-window tone-${h.tone} host-card">
      <div class="window-body">
        <header class="tile-label"><span><i class="status-light ${h.status === "online" ? "" : "idle"}"></i> ${esc(h.host)}</span><b>${esc(h.status)}</b></header>
        <p class="host-role">${esc(h.role)}</p>
        <p class="host-spec">${esc(h.spec)}</p>
        <p class="host-detail">${esc(h.detail)}</p>
      </div>
    </article>`).join("");
  return `<div class="workspace-grid fleet-grid">${intro}${hosts}</div>`;
}

function renderWorkspace(docId) {
  const root = $("workspace-root");
  const ws = state.workspace;
  root.innerHTML =
    ws === "home" ? renderHome() :
    ws === "cards" ? renderCards() :
    ws === "writing" ? renderWriting(docId) :
    renderFleet();
  root.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => gotoWorkspace(b.dataset.goto)));
  root.querySelectorAll("[data-doc]").forEach((b) =>
    b.addEventListener("click", () => { renderWorkspace(b.dataset.doc); }));
  document.querySelectorAll("#workspace-switcher button").forEach((b) =>
    b.classList.toggle("active", b.dataset.ws === ws));
  const idx = WORKSPACES.findIndex((w) => w.id === ws);
  $("footer-ws").textContent = `workspace ${idx + 1} / ${WORKSPACES.length}`;
  if (ws === "home") { applyTheme(); renderAgent(); }
}

function gotoWorkspace(id) {
  state.workspace = id;
  history.replaceState(null, "", id === "home" ? location.pathname : `#${id}`);
  renderWorkspace();
}

/* ============================== PALETTE ============================== */

function paletteItems(query) {
  const q = query.trim().toLowerCase();
  const ws = WORKSPACES
    .filter((w) => !q || `${w.title} ${w.desc}`.toLowerCase().includes(q))
    .map((w) => ({ group:"workspaces", glyph:w.n, title:w.title, desc:w.desc, trail:`alt + ${w.n}`, go:() => gotoWorkspace(w.id) }));
  const cards = q ? CARDS
    .filter((c) => `${c.name} ${c.pitch} ${c.meta}`.toLowerCase().includes(q))
    .slice(0, 6)
    .map((c) => ({ group:"cards", glyph:c.glyph, title:c.name, desc:c.pitch, trail:c.status, go:() => gotoWorkspace("cards") })) : [];
  const docs = q ? DOCS
    .filter((d) => `${d.title} ${d.body.map((b) => b[1]).join(" ")}`.toLowerCase().includes(q))
    .map((d) => ({ group:"writing", glyph:"§", title:d.title, desc:"field note", trail:d.trail,
      go:() => { state.workspace = "writing"; history.replaceState(null, "", "#writing"); renderWorkspace(d.id); } })) : [];
  return [...ws, ...cards, ...docs];
}

function renderPalette() {
  const items = paletteItems(state.palette.query);
  state.palette.selected = Math.min(state.palette.selected, Math.max(0, items.length - 1));
  $("command-results").innerHTML = items.length ? items.map((it, i) => `
    <li class="${i === state.palette.selected ? "selected" : ""}" data-i="${i}">
      <i>${esc(it.glyph)}</i><div><b>${esc(it.title)}</b><span>${esc(it.desc)}</span></div><small>${esc(it.trail)}</small>
    </li>`).join("") : `<li class="empty">no matches</li>`;
  $("command-results").querySelectorAll("li[data-i]").forEach((li) =>
    li.addEventListener("click", () => { closePalette(); items[Number(li.dataset.i)].go(); }));
  return items;
}

function openPalette() {
  state.palette = { open: true, query: "", selected: 0 };
  $("command-overlay").hidden = false;
  $("command-input").value = "";
  renderPalette();
  setTimeout(() => $("command-input").focus(), 0);
}
function closePalette() {
  state.palette.open = false;
  $("command-overlay").hidden = true;
}

/* ============================== INIT ============================== */

function init() {
  // wallpapers
  $("wallpaper-stack").innerHTML =
    THEMES.map((t) => `<div class="wallpaper-frame" style="background-image:url(themes/${t.id}.webp)"></div>`).join("") +
    `<div class="wallpaper-scrim"></div>`;

  // workspace switcher
  $("workspace-switcher").innerHTML = WORKSPACES.map((w) =>
    `<button data-ws="${w.id}" title="${esc(w.title)} · alt + ${w.n}"><span>${w.n}</span><b>${w.short}</b></button>`).join("");
  document.querySelectorAll("#workspace-switcher button").forEach((b) =>
    b.addEventListener("click", () => gotoWorkspace(b.dataset.ws)));

  $("wordmark").addEventListener("click", () => gotoWorkspace("home"));
  $("search-button").addEventListener("click", openPalette);
  $("theme-prev").addEventListener("click", () => setTheme(state.themeIndex - 1));
  $("theme-next").addEventListener("click", () => setTheme(state.themeIndex + 1));
  $("theme-display").addEventListener("click", () => {
    state.themePaused = !state.themePaused;
    $("theme-display").classList.toggle("paused", state.themePaused);
    applyTheme(); scheduleThemeTimer();
  });

  // clock — Atlanta
  const tick = () => {
    $("panel-clock").textContent = new Intl.DateTimeFormat("en", {
      weekday:"short", hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"America/New_York",
    }).format(new Date());
  };
  tick(); setInterval(tick, 1000);

  // keyboard
  window.addEventListener("keydown", (e) => {
    const inField = e.target instanceof HTMLElement && e.target.closest("input, textarea, select");
    if (state.palette.open) {
      const items = paletteItems(state.palette.query);
      if (e.key === "Escape") { e.preventDefault(); closePalette(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); state.palette.selected = (state.palette.selected + 1) % Math.max(1, items.length); renderPalette(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); state.palette.selected = (state.palette.selected - 1 + Math.max(1, items.length)) % Math.max(1, items.length); renderPalette(); }
      else if (e.key === "Enter") { e.preventDefault(); const it = items[state.palette.selected]; if (it) { closePalette(); it.go(); } }
      return;
    }
    if (e.code === "Space" && !inField && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openPalette(); return; }
    if (e.altKey && ["1","2","3","4"].includes(e.key)) { e.preventDefault(); gotoWorkspace(WORKSPACES[Number(e.key) - 1].id); }
  });
  $("command-input").addEventListener("input", (e) => {
    state.palette.query = e.target.value; state.palette.selected = 0; renderPalette();
  });
  $("command-overlay").addEventListener("click", (e) => { if (e.target === $("command-overlay")) closePalette(); });

  // ?theme=<id> deep-link (handy for review + sharing)
  const wanted = new URLSearchParams(location.search).get("theme");
  const wi = THEMES.findIndex((t) => t.id === wanted);
  if (wi >= 0) state.themeIndex = wi;

  // hash deep-link
  const fromHash = () => {
    const h = location.hash.slice(1).split("/")[0];
    if (WORKSPACES.some((w) => w.id === h)) { state.workspace = h; renderWorkspace(); }
  };
  window.addEventListener("hashchange", fromHash);
  if (location.hash) fromHash();

  applyTheme();
  scheduleThemeTimer();
  renderWorkspace();
  agentTick();
}

init();
