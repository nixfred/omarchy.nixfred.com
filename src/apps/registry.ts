import type { AppId } from "../os/types";

export type AppMeta = {
  id: AppId;
  name: string;
  bin: string;
  hint: string;
  search: string;
};

export const APP_LIST: AppMeta[] = [
  { id: "terminal", name: "Terminal", bin: "alacritty", hint: "SUPER + RETURN", search: "term shell alacritty foot kitty" },
  { id: "browser", name: "Browser", bin: "chromium", hint: "SUPER + SHIFT + B", search: "web firefox chrome safari" },
  { id: "files", name: "Files", bin: "nautilus", hint: "SUPER + SHIFT + F", search: "nautilus files manager folder" },
  { id: "editor", name: "Editor", bin: "nvim", hint: "SUPER + SHIFT + N", search: "vim nvim neovim edit code" },
  { id: "btop", name: "Activity", bin: "btop", hint: "SUPER + CTRL + T", search: "btop top htop monitor cpu" },
  { id: "settings", name: "Settings", bin: "omarchy-menu", hint: "SUPER + SHIFT + CTRL + SPACE", search: "theme appearance menu config" },
  { id: "about", name: "About", bin: "fastfetch", hint: "", search: "fastfetch neofetch about system" },
];

export function findApps(q: string): AppMeta[] {
  const s = q.trim().toLowerCase();
  if (!s) return APP_LIST;
  return APP_LIST.filter((a) => `${a.name} ${a.bin} ${a.search}`.toLowerCase().includes(s));
}
