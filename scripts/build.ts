#!/usr/bin/env bun
/**
 * Builds site/data.json from data/plugins.json plus three live sources:
 *   - GitHub repo stats (stars, pushed_at, archived) via `gh api`
 *   - the official marketplace registry.json (omacom/omarchy-plugin-marketplace)
 *   - Fred's GitHub contribution heatmap via the GraphQL API
 *
 * data/plugins.json is hand-edited. site/data.json is generated, never edited.
 * Run:  bun scripts/build.ts
 */

import { $ } from "bun";

const ROOT = new URL("..", import.meta.url).pathname;
const REGISTRY_URL =
  "https://raw.githubusercontent.com/omacom/omarchy-plugin-marketplace/main/registry.json";
const MARKETPLACE_PLUGIN_URL = "https://plugins.omarchy.org/plugin.html?id=";

type Plugin = {
  id: string;
  name: string;
  family: string;
  status: string;
  repo: string | null;
  dir: string;
  version: string;
  tagline: string;
  description: string;
  accent: string;
  flagship?: boolean;
  fork_of?: string;
  supersedes?: string;
};

const src = JSON.parse(
  await Bun.file(`${ROOT}data/plugins.json`).text(),
) as {
  owner: string;
  families: { id: string; name: string; blurb: string }[];
  plugins: Plugin[];
  themes: any[];
  tools: any[];
  retired: any[];
};

// ---------------------------------------------------------------- GitHub stats

async function ghJson(path: string): Promise<any | null> {
  try {
    const out = await $`gh api ${path}`.quiet();
    return JSON.parse(out.stdout.toString());
  } catch {
    return null;
  }
}

const repoNames = [
  ...new Set(
    [
      ...src.plugins.map((p) => p.repo),
      ...src.themes.map((t: any) => t.repo),
      ...src.tools.map((t: any) => t.repo),
    ].filter(Boolean) as string[],
  ),
];

console.error(`→ fetching ${repoNames.length} repos from GitHub…`);
type RepoStat = {
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;      // issues only, pulls subtracted
  open_prs: number;
  prs: { number: number; title: string; author: string; created: string; draft: boolean; url: string }[];
  issues: { number: number; title: string; author: string; created: string; url: string }[];
  pushed: string | null;
  created: string | null;
  archived: boolean;
  license: string | null;
  language: string | null;
  topics: string[];
  default_branch: string;
  release: { tag: string; published: string | null } | null;
  contributors: { login: string; avatar: string; commits: number }[];
  commits: number;          // total across the returned contributors
};

const repoStats = new Map<string, RepoStat>();
await Promise.all(
  repoNames.map(async (r) => {
    // The repo record, its open pull requests, its contributors and its latest
    // release, in parallel. GitHub counts pulls inside open_issues_count, so the
    // pulls list is what makes an honest issue count possible.
    const [j, pulls, issuesRaw, contribs, rel] = await Promise.all([
      ghJson(`repos/${r}`),
      ghJson(`repos/${r}/pulls?state=open&per_page=100&sort=created&direction=desc`),
      ghJson(`repos/${r}/issues?state=open&per_page=100&sort=created&direction=desc`),
      ghJson(`repos/${r}/contributors?per_page=8&anon=0`),
      ghJson(`repos/${r}/releases/latest`),
    ]);
    if (!j || j.message) return;

    const openPrs = Array.isArray(pulls) ? pulls.length : 0;
    const people = Array.isArray(contribs) ? contribs : [];

    const prs = (Array.isArray(pulls) ? pulls : []).map((q: any) => ({
      number: q.number,
      title: q.title,
      author: q.user?.login ?? "?",
      created: q.created_at,
      draft: !!q.draft,
      url: q.html_url,
    }));

    // The issues endpoint returns pull requests too. Anything carrying a
    // pull_request key is a PR wearing an issue's clothes; drop it.
    const issues = (Array.isArray(issuesRaw) ? issuesRaw : [])
      .filter((q: any) => !q.pull_request)
      .map((q: any) => ({
        number: q.number,
        title: q.title,
        author: q.user?.login ?? "?",
        created: q.created_at,
        url: q.html_url,
      }));

    repoStats.set(r, {
      stars: j.stargazers_count ?? 0,
      forks: j.forks_count ?? 0,
      watchers: j.subscribers_count ?? 0,
      open_issues: issues.length,
      open_prs: openPrs,
      prs,
      issues,
      pushed: j.pushed_at ?? null,
      created: j.created_at ?? null,
      archived: !!j.archived,
      license: j.license?.spdx_id ?? null,
      language: j.language ?? null,
      topics: j.topics ?? [],
      default_branch: j.default_branch ?? "main",
      release: rel && !rel.message ? { tag: rel.tag_name, published: rel.published_at ?? null } : null,
      contributors: people.map((c: any) => ({
        login: c.login,
        avatar: c.avatar_url,
        commits: c.contributions ?? 0,
      })),
      commits: people.reduce((n: number, c: any) => n + (c.contributions ?? 0), 0),
    });
  }),
);
console.error(`  got ${repoStats.size}/${repoNames.length}`);

// ------------------------------------------------- official marketplace status

console.error("→ fetching official marketplace registry…");
let listedRepos = new Map<string, { listedAt: string | null; ids: string[]; category: string | null; tags: string[] }>();
try {
  const reg = (await (await fetch(REGISTRY_URL)).json()) as any;
  for (const s of reg.sources ?? []) {
    const repo = String(s.repo ?? "").replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    if (!repo.toLowerCase().startsWith(`${src.owner.toLowerCase()}/`)) continue;
    const ids = Object.keys(s.plugins ?? {});
    const first = ids.length ? s.plugins[ids[0]] : null;
    listedRepos.set(repo.toLowerCase(), {
      listedAt: s.listedAt ?? s.addedAt ?? null,
      ids,
      category: first?.category ?? null,
      tags: first?.tags ?? [],
    });
  }
  console.error(`  ${listedRepos.size} of our repos are listed`);
} catch (e) {
  console.error(`  ! registry fetch failed, listing status falls back to "unknown": ${e}`);
  listedRepos = new Map();
}

// ------------------------------------------------------------- screenshot scan

const shotDir = `${ROOT}site/assets/img/shot`;
const haveShot = new Set<string>();
try {
  for (const f of await Array.fromAsync(new Bun.Glob("*.{png,webp,avif,jpg}").scan(shotDir))) {
    haveShot.add(f.replace(/\.(png|webp|avif|jpg)$/, ""));
  }
} catch {
  /* no screenshots yet */
}

// ---------------------------------------------------------------- the heatmap

console.error("→ fetching contribution heatmap…");
let heatmap: { total: number; weeks: { date: string; count: number; level: number }[][] } | null = null;
try {
  const q = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const out = await $`gh api graphql -f query=${q} -F login=${src.owner}`.quiet();
  const cal = JSON.parse(out.stdout.toString()).data.user.contributionsCollection.contributionCalendar;
  const levels: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  heatmap = {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w: any) =>
      w.contributionDays.map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        level: levels[d.contributionLevel] ?? 0,
      })),
    ),
  };
  console.error(`  ${heatmap.total} contributions in the last year`);
} catch (e) {
  console.error(`  ! heatmap unavailable: ${e}`);
}

// ------------------------------------------------------------------- assemble

const glyphFor = (id: string) => `assets/img/glyph/${id.replace(/\./g, "-")}.svg`;

const plugins = src.plugins.map((p) => {
  const stats = p.repo ? repoStats.get(p.repo) : undefined;
  const listing = p.repo ? listedRepos.get(p.repo.toLowerCase()) : undefined;
  return {
    ...p,
    stars: stats?.stars ?? 0,
    forks: stats?.forks ?? 0,
    watchers: stats?.watchers ?? 0,
    open_prs: stats?.open_prs ?? 0,
    open_issues: stats?.open_issues ?? 0,
    prs: stats?.prs ?? [],
    issues: stats?.issues ?? [],
    pushed: stats?.pushed ?? null,
    created: stats?.created ?? null,
    license: stats?.license ?? null,
    language: stats?.language ?? null,
    topics: stats?.topics ?? [],
    default_branch: stats?.default_branch ?? "main",
    release: stats?.release ?? null,
    contributors: stats?.contributors ?? [],
    commits: stats?.commits ?? 0,
    repo_url: p.repo ? `https://github.com/${p.repo}` : null,
    glyph: glyphFor(p.id),
    shot: haveShot.has(p.id.replace(/\./g, "-")) ? `assets/img/shot/${p.id.replace(/\./g, "-")}.png` : null,
    listed: !!listing,
    listed_at: listing?.listedAt ?? null,
    listing_url: listing ? `${MARKETPLACE_PLUGIN_URL}${encodeURIComponent(p.id)}` : null,
    marketplace_category: listing?.category ?? null,
    marketplace_tags: listing?.tags ?? [],
    install: p.repo ? `omarchy plugin install ${p.repo}` : null,
    clone: p.repo ? `git clone https://github.com/${p.repo}.git` : null,
  };
});

// Fred's rule: newest created first, everywhere, including filtered views.
// Sorted once here so the page cannot accidentally render a different order.
const newestFirst = (a: any, b: any) =>
  (Date.parse(b.created ?? "1970-01-01") || 0) - (Date.parse(a.created ?? "1970-01-01") || 0);
plugins.sort(newestFirst);

// Family sections follow the same rule: the family holding the newest plugin leads.
const familyNewest = new Map<string, number>();
for (const p of plugins) {
  const t = Date.parse(p.created ?? "1970-01-01") || 0;
  if (t > (familyNewest.get(p.family) ?? 0)) familyNewest.set(p.family, t);
}
const families = [...src.families].sort(
  (a, b) => (familyNewest.get(b.id) ?? 0) - (familyNewest.get(a.id) ?? 0),
);

const out = {
  generated_at: new Date().toISOString(),
  owner: src.owner,
  families,
  plugins,
  themes: src.themes.map((t: any) => ({
    ...t,
    stars: repoStats.get(t.repo)?.stars ?? 0,
    repo_url: `https://github.com/${t.repo}`,
  })),
  tools: src.tools.map((t: any) => ({
    ...t,
    stars: repoStats.get(t.repo)?.stars ?? 0,
    repo_url: `https://github.com/${t.repo}`,
  })),
  retired: src.retired,
  heatmap,
  stats: {
    plugins: plugins.length,
    live: plugins.filter((p) => p.status === "live").length,
    listed: plugins.filter((p) => p.listed).length,
    families: src.families.length,
    themes: src.themes.length,
    stars: plugins.reduce((n, p) => n + p.stars, 0),
    with_shots: plugins.filter((p) => p.shot).length,
  },
};

await Bun.write(`${ROOT}site/data.json`, JSON.stringify(out, null, 2));

// ------------------------------------------------------------- cache busting
//
// Pages serves assets with a long max-age. Without a changing URL a browser
// happily shows a four-hour-old app.js and the deploy looks like it never
// happened. Stamp each asset reference with a hash of its own contents.

const stamp = async (file: string) => {
  const bytes = await Bun.file(`${ROOT}site/${file}`).arrayBuffer();
  return Bun.hash(bytes).toString(16).slice(0, 8);
};

const cssV = await stamp("assets/css/style.css");
const jsV = await stamp("assets/js/app.js");

let html = await Bun.file(`${ROOT}site/index.html`).text();
html = html
  .replace(/(assets\/css\/style\.css)(\?v=[a-f0-9]+)?/g, `$1?v=${cssV}`)
  .replace(/(assets\/js\/app\.js)(\?v=[a-f0-9]+)?/g, `$1?v=${jsV}`);
await Bun.write(`${ROOT}site/index.html`, html);
console.error(`  stamped css=${cssV} js=${jsV}`);
console.error(
  `✓ site/data.json — ${out.stats.plugins} plugins, ${out.stats.listed} listed, ` +
    `${out.stats.stars} stars, ${out.stats.with_shots} screenshots`,
);
