// Cloudflare Pages Function: /proxy?url=<target>
// Fetches a page and strips frame-blocking headers so it can render inside the
// simulated Omarchy browser window. HTML gets a <base> tag so relative assets
// load from the real origin (we only proxy the top document).
//
// Content sites (docs, blogs, Wikipedia) load. Logins and heavy SPAs often will
// not — a fundamental limit of embedding third-party sites.

const BLOCKED_HOST = /^(localhost$|.*\.local$|127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|\[)/i;

export async function onRequest(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return new Response("missing ?url", { status: 400 });

  let t;
  try {
    t = new URL(target);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (t.protocol !== "http:" && t.protocol !== "https:")
    return new Response("only http/https", { status: 400 });
  if (BLOCKED_HOST.test(t.hostname) || t.hostname === "169.254.169.254")
    return new Response("blocked host", { status: 403 });

  let upstream;
  try {
    upstream = await fetch(t.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      cf: { cacheTtl: 60, cacheEverything: false },
    });
  } catch (e) {
    return new Response("upstream fetch failed: " + e.message, { status: 502 });
  }

  const ct = upstream.headers.get("content-type") || "text/html; charset=utf-8";
  const headers = new Headers();
  headers.set("content-type", ct);
  for (const h of ["cache-control", "content-language", "content-disposition"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("x-proxied-by", "omarchy.nixfred.com");
  headers.set("access-control-allow-origin", "*");

  if (ct.includes("text/html")) {
    let html = await upstream.text();
    const finalUrl = (upstream.url || t.toString()).replace(/"/g, "&quot;");
    const baseTag = `<base href="${finalUrl}">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => m + baseTag);
    } else {
      html = baseTag + html;
    }
    return new Response(html, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
