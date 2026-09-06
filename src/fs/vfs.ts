export type VNode =
  | { type: "dir"; name: string; children: Record<string, VNode> }
  | { type: "file"; name: string; content: string };

const LOGO = `                 ▄▄▄
 ▄█████▄    ▄███████████▄    ▄███████   ▄███████   ▄███████   ▄█   █▄    ▄█   █▄
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   █▀   ███   ███  ███   ███
███   ███  ███   ███   ███ ▄███▄▄▄███ ▄███▄▄▄██▀  ███       ▄███▄▄▄███▄ ███▄▄▄███
███   ███  ███   ███   ███ ▀███▀▀▀███ ▀███▀▀▀▀    ███      ▀▀███▀▀▀███  ▀▀▀▀▀▀███
███   ███  ███   ███   ███  ███   ███ ██████████  ███   █▄   ███   ███  ▄██   ███
███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███   ███  ███   ███
 ▀█████▀    ▀█   ███   █▀   ███   █▀   ███   ███  ███████▀   ███   █▀    ▀█████▀
                                       ███   █▀`;

function dir(name: string, children: VNode[] = []): VNode {
  const map: Record<string, VNode> = {};
  for (const c of children) map[c.name] = c;
  return { type: "dir", name, children: map };
}
function file(name: string, content: string): VNode {
  return { type: "file", name, content };
}

function seed(): VNode {
  return dir("/", [
    dir("home", [
      dir("pi", [
        file(
          "README.md",
          `# Welcome to Omarchy

This is a real Omarchy session running in your browser.
It is not a screenshot and not a brochure.

- Super is **Alt** here (the host OS already owns Super).
- Tap Alt, then a key, if chords get stolen. Or hold Alt.
- Super+Return — terminal
- Super+Space — launcher
- Super+K — keybindings
- Super+1..0 — workspaces

Theme palettes and wallpapers are the stock Omarchy 4 set.
The window manager is dwindle, like Hyprland on a real box.

https://omarchy.org
`,
        ),
        dir("Desktop", []),
        dir("Downloads", [
          file(
            "welcome.txt",
            "Your computer should feel like yours.\nMalleable all the way down.\n",
          ),
        ]),
        dir("Projects", [
          dir("omarchy.nixfred.com", [
            file("README.md", "Omarchy OS in the browser. This site.\n"),
          ]),
        ]),
        dir(".config", [
          dir("omarchy", [file("current-theme", "tokyo-night\n")]),
        ]),
      ]),
    ]),
    dir("etc", [
      file(
        "os-release",
        `NAME="Omarchy"
PRETTY_NAME="Omarchy"
ID=omarchy
ID_LIKE=arch
BUILD_ID=4.0.2
HOME_URL="https://omarchy.org"
DOCUMENTATION_URL="https://learn.omarchy.org"
`,
      ),
    ]),
    dir("usr", [
      dir("share", [
        dir("omarchy", [
          file("version", "4.0.2\n"),
          file("logo.txt", LOGO + "\n"),
        ]),
      ]),
    ]),
  ]);
}

let root: VNode = seed();
let cwd = "/home/pi";

export const HOME = "/home/pi";

export function resetFs() {
  root = seed();
  cwd = HOME;
}

export function getCwd() {
  return cwd;
}

export function resolve(path: string, from = cwd): string {
  let p = path.trim() || from;
  if (p === "~") p = HOME;
  else if (p.startsWith("~/")) p = HOME + p.slice(1);
  else if (!p.startsWith("/")) p = from.replace(/\/+$/, "") + "/" + p;
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return "/" + parts.join("/");
}

function walk(path: string): VNode | null {
  const abs = resolve(path, "/");
  if (abs === "/") return root;
  let node: VNode = root;
  for (const seg of abs.split("/").filter(Boolean)) {
    if (node.type !== "dir") return null;
    const next = node.children[seg];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function stat(path: string): VNode | null {
  return walk(path);
}

export function readFile(path: string): string | null {
  const n = walk(path);
  return n && n.type === "file" ? n.content : null;
}

export function list(path: string): VNode[] | null {
  const n = walk(path);
  if (!n || n.type !== "dir") return null;
  return Object.values(n.children).sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function mkdir(path: string): string | null {
  const abs = resolve(path);
  const parentPath = abs.split("/").slice(0, -1).join("/") || "/";
  const name = abs.split("/").pop()!;
  const parent = walk(parentPath);
  if (!parent || parent.type !== "dir") return `mkdir: ${path}: no such directory`;
  if (parent.children[name]) return `mkdir: ${path}: already exists`;
  parent.children[name] = dir(name);
  return null;
}

export function writeFile(path: string, content: string): string | null {
  const abs = resolve(path);
  const parentPath = abs.split("/").slice(0, -1).join("/") || "/";
  const name = abs.split("/").pop()!;
  const parent = walk(parentPath);
  if (!parent || parent.type !== "dir") return `cannot write ${path}: no such directory`;
  parent.children[name] = file(name, content);
  return null;
}

export function chdir(path: string): string | null {
  const abs = resolve(path);
  const n = walk(abs);
  if (!n) return `cd: ${path}: no such file or directory`;
  if (n.type !== "dir") return `cd: ${path}: not a directory`;
  cwd = abs;
  return null;
}

export function tree(path: string, depth = 0, prefix = ""): string[] {
  const n = walk(path);
  if (!n) return [`${path}: not found`];
  if (n.type === "file") return [prefix + n.name];
  const lines: string[] = depth === 0 ? [path] : [prefix + n.name + "/"];
  const kids = Object.values(n.children);
  kids.forEach((c, i) => {
    const last = i === kids.length - 1;
    const branch = last ? "└── " : "├── ";
    const next = prefix + (last ? "    " : "│   ");
    const childPath = (path === "/" ? "" : path) + "/" + c.name;
    if (c.type === "file") lines.push(prefix + branch + c.name);
    else {
      lines.push(prefix + branch + c.name + "/");
      if (depth < 3) lines.push(...tree(childPath, depth + 1, next).slice(1));
    }
  });
  return lines;
}

export { LOGO };
