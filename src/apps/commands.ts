import { LOGO, chdir, getCwd, list, mkdir, readFile, resolve, stat, tree, writeFile } from "../fs/vfs";
import {
  bumpFs,
  closeFocused,
  cycleTheme,
  get,
  launch,
  notify,
  reboot,
  setPhase,
  setTheme,
  setWorkspace,
} from "../os/store";
import { THEMES, themeById } from "../theme/themes";

export type Line = { text: string; kind?: "cmd" | "ok" | "warn" | "err" | "muted" | "accent" | "ascii" | "plain" };
export type CmdResult = { lines: Line[]; cwd?: string; open?: { app: "editor" | "files" | "browser" | "btop" | "about" | "settings" | "terminal"; path?: string; url?: string } };

const L = (text: string, kind?: Line["kind"]): Line => ({ text, kind });

const HELP: [string, string][] = [
  ["help", "this list"],
  ["fastfetch", "system info"],
  ["omarchy version / theme list / theme set <id>", "the distro CLI"],
  ["ls · cd · pwd · cat · tree · mkdir", "the filesystem"],
  ["nvim <file>", "open the editor"],
  ["firefox [url] · nautilus · btop", "launch apps"],
  ["theme <name> · [ ]", "switch themes"],
  ["lock · screensaver · reboot", "session"],
  ["hyprctl workspaces", "the tiling map"],
  ["cowsay · echo · date · whoami · uname · clear", "unix-shaped"],
];

function osRelease(): string {
  return readFile("/etc/os-release") ?? "";
}

export function runCommand(raw: string, cwd: string): CmdResult {
  const input = raw.replace(/^:\s*/, "").trim();
  if (!input) return { lines: [] };
  const [cmd = "", ...rest] = input.split(/\s+/);
  const arg = rest.join(" ");
  const c = cmd.toLowerCase();

  if (c === "help" || c === "?") {
    return { lines: HELP.map(([k, v]) => L(`${k.padEnd(42)} ${v}`, "muted")) };
  }
  if (c === "clear") return { lines: [], cwd };
  if (c === "pwd") return { lines: [L(cwd)] };
  if (c === "whoami") return { lines: [L("pi")] };
  if (c === "hostname") return { lines: [L("omarchy")] };
  if (c === "date") return { lines: [L(new Date().toString())] };
  if (c === "uname") {
    if (arg.includes("-a")) return { lines: [L("Linux omarchy 7.1.9-arch1-2 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux")] };
    return { lines: [L("Linux")] };
  }
  if (c === "echo") return { lines: [L(arg)] };
  if (c === "ls") {
    const path = arg && !arg.startsWith("-") ? arg : cwd;
    const kids = list(path);
    if (!kids) return { lines: [L(`ls: ${path}: no such directory`, "err")] };
    return {
      lines: kids.map((n) => L(n.type === "dir" ? n.name + "/" : n.name, n.type === "dir" ? "accent" : "plain")),
    };
  }
  if (c === "tree") {
    return { lines: tree(arg || cwd).map((t) => L(t, "muted")) };
  }
  if (c === "cd") {
    const err = chdir(arg || "/home/pi");
    if (err) return { lines: [L(err, "err")] };
    return { lines: [], cwd: getCwd() };
  }
  if (c === "cat") {
    if (!arg) return { lines: [L("cat: missing operand", "err")] };
    const data = readFile(resolve(arg, cwd));
    if (data === null) {
      const n = stat(resolve(arg, cwd));
      if (n?.type === "dir") return { lines: [L(`cat: ${arg}: is a directory`, "err")] };
      return { lines: [L(`cat: ${arg}: no such file`, "err")] };
    }
    return { lines: data.split("\n").map((t) => L(t)) };
  }
  if (c === "mkdir") {
    if (!arg) return { lines: [L("mkdir: missing operand", "err")] };
    const err = mkdir(resolve(arg, cwd));
    if (err) return { lines: [L(err, "err")] };
    bumpFs();
    return { lines: [] };
  }
  if (c === "touch") {
    if (!arg) return { lines: [L("touch: missing operand", "err")] };
    const err = writeFile(resolve(arg, cwd), readFile(resolve(arg, cwd)) ?? "");
    if (err) return { lines: [L(err, "err")] };
    bumpFs();
    return { lines: [] };
  }

  if (c === "fastfetch" || c === "neofetch" || c === "about") {
    const t = themeById(get().themeId);
    const lines = [
      L(LOGO, "ascii"),
      L(""),
      L("pi@omarchy", "accent"),
      L("──────────", "muted"),
      L("OS          Omarchy 4.0.2 (Arch)"),
      L("Host        omarchy.nixfred.com"),
      L("Kernel      browser-hypr 7.1.9"),
      L("WM          Hyprland (dwindle) · simulated"),
      L("Shell       omarchy-os 1.0"),
      L(`Theme       ${t.name}`),
      L("Terminal    alacritty (here)"),
      L("CPU         your browser"),
      L("GPU         whatever drew this"),
    ];
    return { lines, open: c === "about" ? { app: "about" } : undefined };
  }

  if (c === "omarchy") {
    const sub = (rest[0] || "").toLowerCase();
    const restArg = rest.slice(1).join(" ");
    if (!sub || sub === "help" || sub === "--help") {
      return {
        lines: [
          L("omarchy — the distro CLI, in your browser", "accent"),
          L("  version          show version", "muted"),
          L("  theme list       stock themes", "muted"),
          L("  theme set <id>   apply a theme", "muted"),
          L("  commands         this, plus the rest of the session", "muted"),
        ],
      };
    }
    if (sub === "version" || sub === "-v") return { lines: [L("Omarchy 4.0.2")] };
    if (sub === "theme") {
      const a = restArg.toLowerCase();
      if (!a || a === "list" || a === "ls") {
        return { lines: THEMES.map((t) => L(`${t.id.padEnd(20)} ${t.name}${t.id === get().themeId ? "  *" : ""}`, t.id === get().themeId ? "ok" : "plain")) };
      }
      if (a.startsWith("set ")) {
        const id = a.slice(4).trim();
        const t = THEMES.find((x) => x.id === id || x.name.toLowerCase() === id);
        if (!t) return { lines: [L(`omarchy: no theme '${id}'`, "err")] };
        setTheme(t.id);
        return { lines: [L(`theme → ${t.name}`, "ok")] };
      }
      const t = THEMES.find((x) => x.id === a || x.name.toLowerCase() === a);
      if (t) {
        setTheme(t.id);
        return { lines: [L(`theme → ${t.name}`, "ok")] };
      }
      return { lines: [L("omarchy theme list | omarchy theme set <id>", "muted")] };
    }
    if (sub === "commands") {
      return { lines: HELP.map(([k, v]) => L(`${k.padEnd(42)} ${v}`, "muted")) };
    }
    return { lines: [L(`omarchy: unknown command '${sub}'`, "err")] };
  }

  if (c === "theme" || c === "omarchy-theme-set") {
    if (!arg || arg === "list") {
      return { lines: THEMES.map((t) => L(t.id, t.id === get().themeId ? "ok" : "plain")) };
    }
    const t = THEMES.find((x) => x.id === arg || x.name.toLowerCase() === arg.toLowerCase());
    if (!t) return { lines: [L(`no theme '${arg}'`, "err")] };
    setTheme(t.id);
    return { lines: [L(t.name, "ok")] };
  }
  if (c === "n" || c === "next-theme") {
    cycleTheme(1);
    return { lines: [L(themeById(get().themeId).name, "ok")] };
  }

  if (c === "hyprctl") {
    const s = get();
    if (arg.startsWith("workspaces") || !arg) {
      const lines = Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const wins = s.windows.filter((w) => w.workspace === n);
        const mark = n === s.workspace ? "*" : " ";
        return L(`${mark} workspace ${n}: ${wins.length} windows ${wins.map((w) => w.title).join(", ")}`.trimEnd());
      });
      return { lines };
    }
    if (arg.startsWith("clients") || arg.startsWith("windows")) {
      return { lines: s.windows.map((w) => L(`${w.id}  ws${w.workspace}  ${w.floating ? "float" : "tile"}  ${w.appId}  ${w.title}`)) };
    }
    return { lines: [L("hyprctl workspaces | hyprctl clients", "muted")] };
  }

  if (c === "nvim" || c === "vim" || c === "vi" || c === "nano" || c === "hx" || c === "code") {
    const path = arg ? resolve(arg, cwd) : "/home/pi/README.md";
    return { lines: [L(`opening ${path}`, "muted")], open: { app: "editor", path } };
  }
  if (c === "nautilus" || c === "files" || c === "open") {
    return { lines: [], open: { app: "files", path: arg ? resolve(arg, cwd) : cwd } };
  }
  if (c === "firefox" || c === "chromium" || c === "browser" || c === "curl") {
    const url = arg || "https://omarchy.org";
    if (c === "curl" && !arg) return { lines: [L("curl: try firefox https://omarchy.org", "muted")] };
    if (c === "curl") {
      return { lines: [L(`open ${arg} in the browser instead — this is a desktop, not a pipe.`, "muted")], open: { app: "browser", url: arg } };
    }
    return { lines: [], open: { app: "browser", url } };
  }
  if (c === "btop" || c === "htop" || c === "top") return { lines: [], open: { app: "btop" } };
  if (c === "settings" || c === "omarchy-menu") return { lines: [], open: { app: "settings" } };

  if (c === "lock" || c === "hyprlock" || c === "omarchy-system-lock") {
    setPhase("lock");
    return { lines: [L("locking session…", "muted")] };
  }
  if (c === "screensaver" || c === "ttfx") {
    setPhase("screensaver");
    return { lines: [L("ttfx --random-effect", "muted")] };
  }
  if (c === "reboot" || c === "shutdown" || c === "poweroff") {
    reboot();
    return { lines: [L("Broadcast message from pi@omarchy: rebooting NOW", "warn")] };
  }
  if (c === "exit" || c === "logout" || c === "q") {
    closeFocused();
    return { lines: [] };
  }

  if (c === "cowsay") {
    const msg = arg || "your computer should feel like yours";
    const bar = " " + "_".repeat(msg.length + 2);
    const bot = " " + "-".repeat(msg.length + 2);
    return {
      lines: [
        L(bar),
        L(`< ${msg} >`),
        L(bot),
        L("        \\   ^__^"),
        L("         \\  (oo)\\_______"),
        L("            (__)\\       )\\/\\"),
        L("                ||----w |"),
        L("                ||     ||"),
      ],
    };
  }

  if (c === "sudo" || c === "su") return { lines: [L("pi is not in the sudoers file. This incident will be reported.", "warn")] };
  if (c === "pacman" || c === "yay" || c === "paru") {
    return { lines: [L(":: Synchronizing package databases...", "muted"), L("there is nothing to install. you are already on the website.", "muted")] };
  }
  if (["apt", "brew", "dnf", "nix"].includes(c)) return { lines: [L(`${c}: command not found. it is pacman here.`, "warn")] };
  if (["rm", "dd", "mkfs", "format"].includes(c)) return { lines: [L(`${c}: nice try. localStorage is the disk. you cannot brick a website.`, "warn")] };
  if (c === "ws" || c === "workspace") {
    const n = Number(arg);
    if (n >= 1 && n <= 10) {
      setWorkspace(n);
      return { lines: [L(`workspace ${n}`, "ok")] };
    }
    return { lines: [L(`workspace ${get().workspace}`, "muted")] };
  }
  if (c === "notify-send") {
    notify(arg || "Omarchy", "", "blue");
    return { lines: [] };
  }
  if (c === "cat" && arg === "/etc/os-release") {
    return { lines: osRelease().split("\n").map((t) => L(t)) };
  }

  return { lines: [L(`${cmd}: command not found`, "err"), L("try help", "muted")] };
}
