/**
 * omarchy-data — keeps the catalogue's live figures fresh between builds.
 *
 * WHY THIS EXISTS
 *
 * The GitHub Action rebuilds site/data.json nightly and commits it, but the
 * Pages project is DIRECT-UPLOAD, not Git-connected, so that commit deploys
 * nothing. Until now the live site only changed when someone ran
 * `wrangler pages deploy` by hand.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not rebuild data.json. Descriptions, glyphs, screenshots, families and
 * contributor lists are stable and the nightly build already has them right.
 * Only three things actually move during a day: stars, open pull requests and
 * open issues. So this OVERLAYS those onto the deployed file rather than
 * regenerating it — one GraphQL query per run instead of ~180 REST calls, which
 * is the difference between sitting comfortably inside GitHub's rate limit and
 * exhausting it every hour.
 *
 * SHAPE
 *
 *   cron, every 3 minutes → fetch origin data.json, fetch GitHub, merge, put KV
 *   fetch /data.json      → serve the KV copy, fall back to the origin
 *
 * (The cron expression lives in wrangler.toml and deliberately not here: it
 * contains a slash-star sequence that would close this comment.)
 *
 * The origin is read through the *.pages.dev hostname on purpose. Reading
 * https://omarchy.nixfred.com/data.json would hit this Worker's own route and
 * loop.
 */

const ORIGIN = "https://omarchy-nixfred-com.pages.dev/data.json";
const KEY = "data.json";
const STALE_AFTER_MS = 30 * 60 * 1000; // beyond this, prefer the origin

/** Repos whose live numbers we refresh. Taken from the file itself, so adding a
 *  plugin to data/plugins.json is all anyone ever has to do. */
function reposOf(data) {
  const out = new Set();
  for (const p of [...(data.plugins || []), ...(data.tools || []), ...(data.themes || [])]) {
    if (p.repo) out.add(p.repo);
  }
  return [...out];
}

/** One query, one alias per repo. GitHub rejects an alias starting with a digit
 *  or containing a dash, hence the index-based names. */
function buildQuery(repos) {
  const frag = `
    fragment F on Repository {
      stargazerCount
      forkCount
      watchers { totalCount }
      pushedAt
      defaultBranchRef { name }
      pullRequests(states: OPEN, first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes { number title createdAt isDraft url author { login } }
      }
      issues(states: OPEN, first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes { number title createdAt url author { login } }
      }
    }`;
  const parts = repos.map((r, i) => {
    const [owner, name] = r.split("/");
    return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ...F }`;
  });
  return `${frag}\nquery { ${parts.join("\n")} }`;
}

async function fetchLive(repos, token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      // GitHub rejects a GraphQL request with no User-Agent.
      "user-agent": "omarchy.nixfred.com-data-worker",
    },
    body: JSON.stringify({ query: buildQuery(repos) }),
  });
  if (!res.ok) throw new Error(`github ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  // Partial failures are normal — a renamed or deleted repo nulls one alias
  // while the rest succeed. Keep what came back rather than discarding the run.
  const live = new Map();
  repos.forEach((repo, i) => {
    const r = body.data?.[`r${i}`];
    if (!r) return;
    live.set(repo, {
      stars: r.stargazerCount ?? 0,
      forks: r.forkCount ?? 0,
      watchers: r.watchers?.totalCount ?? 0,
      pushed: r.pushedAt ?? null,
      default_branch: r.defaultBranchRef?.name ?? "main",
      open_prs: r.pullRequests?.totalCount ?? 0,
      prs: (r.pullRequests?.nodes || []).map((q) => ({
        number: q.number,
        title: q.title,
        author: q.author?.login ?? "?",
        created: q.createdAt,
        draft: !!q.isDraft,
        url: q.url,
      })),
      open_issues: r.issues?.totalCount ?? 0,
      issues: (r.issues?.nodes || []).map((q) => ({
        number: q.number,
        title: q.title,
        author: q.author?.login ?? "?",
        created: q.createdAt,
        url: q.url,
      })),
    });
  });
  if (!live.size) throw new Error(`github returned nothing usable: ${JSON.stringify(body.errors || []).slice(0, 200)}`);
  return live;
}

/** Overlay the live fields, leave everything else exactly as built. */
function merge(data, live) {
  const apply = (item) => {
    const v = item.repo && live.get(item.repo);
    return v ? { ...item, ...v } : item;
  };
  const plugins = (data.plugins || []).map(apply);
  const tools = (data.tools || []).map(apply);
  const themes = (data.themes || []).map(apply);
  return {
    ...data,
    plugins,
    tools,
    themes,
    stats: {
      ...data.stats,
      stars: plugins.reduce((n, p) => n + (p.stars || 0), 0),
    },
    live_refreshed_at: new Date().toISOString(),
  };
}

async function refresh(env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN secret is not set");
  const res = await fetch(ORIGIN, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error(`origin ${res.status}`);
  const data = await res.json();
  const merged = merge(data, await fetchLive(reposOf(data), env.GITHUB_TOKEN));
  await env.OMARCHY_DATA.put(KEY, JSON.stringify(merged), {
    metadata: { at: Date.now() },
  });
  return merged;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      refresh(env).catch((e) => {
        // Loud in `wrangler tail`, and the route keeps serving the last good
        // copy, so a GitHub outage degrades to stale rather than to broken.
        console.error("refresh failed:", e.message);
      }),
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // A manual kick, for testing and for after a deploy.
    if (url.pathname === "/__refresh") {
      try {
        const m = await refresh(env);
        return Response.json({ ok: true, refreshed_at: m.live_refreshed_at, stars: m.stats.stars });
      } catch (e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 });
      }
    }

    const { value, metadata } = await env.OMARCHY_DATA.getWithMetadata(KEY);
    const age = metadata?.at ? Date.now() - metadata.at : Infinity;

    // Stale or missing: let the origin answer. A copy that stopped refreshing is
    // worse than the file the site was built with, because it is wrong AND has
    // no way of saying so.
    if (!value || age > STALE_AFTER_MS) {
      const res = await fetch(ORIGIN, { cf: { cacheTtl: 0 } });
      return new Response(res.body, {
        status: res.status,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=60, must-revalidate",
          "x-data-source": value ? "origin (kv stale)" : "origin (kv empty)",
        },
      });
    }

    return new Response(value, {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=60, must-revalidate",
        "x-data-source": "kv",
        "x-data-age-seconds": String(Math.round(age / 1000)),
      },
    });
  },
};
