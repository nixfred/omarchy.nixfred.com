import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const BLOCKED_HOST = /^(localhost$|.*\.local$|127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|\[)/i;

async function proxy(req: { url?: string; headers: { host?: string } }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: string | Buffer) => void }) {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const target = url.searchParams.get("url");
  if (!target) {
    res.statusCode = 400;
    res.end("missing ?url");
    return;
  }
  let t: URL;
  try {
    t = new URL(target);
  } catch {
    res.statusCode = 400;
    res.end("bad url");
    return;
  }
  if (t.protocol !== "http:" && t.protocol !== "https:") {
    res.statusCode = 400;
    res.end("only http/https");
    return;
  }
  if (BLOCKED_HOST.test(t.hostname) || t.hostname === "169.254.169.254") {
    res.statusCode = 403;
    res.end("blocked host");
    return;
  }
  try {
    const upstream = await fetch(t.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const ct = upstream.headers.get("content-type") || "text/html; charset=utf-8";
    res.setHeader("content-type", ct);
    res.setHeader("x-proxied-by", "omarchy.nixfred.com-dev");
    if (ct.includes("text/html")) {
      let html = await upstream.text();
      const finalUrl = (upstream.url || t.toString()).replace(/"/g, "&quot;");
      const baseTag = `<base href="${finalUrl}">`;
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + baseTag) : baseTag + html;
      res.statusCode = upstream.status;
      res.end(html);
      return;
    }
    res.statusCode = upstream.status;
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) {
    res.statusCode = 502;
    res.end("upstream fetch failed: " + (e as Error).message);
  }
}

export default defineConfig({
  plugins: [
    preact(),
    {
      name: "omarchy-proxy",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/proxy")) void proxy(req, res);
          else next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/proxy")) void proxy(req, res);
          else next();
        });
      },
    },
  ],
  server: { port: 4720, strictPort: true, host: "127.0.0.1" },
  preview: { port: 4720, strictPort: true, host: "127.0.0.1" },
});
