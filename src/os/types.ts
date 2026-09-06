export type Phase = "boot" | "desktop" | "screensaver" | "lock";

export type AppId =
  | "terminal"
  | "browser"
  | "files"
  | "editor"
  | "settings"
  | "btop"
  | "about";

export type Rect = { x: number; y: number; w: number; h: number };

export type Win = {
  id: string;
  appId: AppId;
  title: string;
  workspace: number;
  floating: boolean;
  fullscreen: boolean;
  float: Rect;
  app: Record<string, unknown>;
};

export type Split = {
  kind: "split";
  dir: "h" | "v";
  ratio: number;
  first: Tree;
  second: Tree;
};
export type Leaf = { kind: "leaf"; id: string };
export type Empty = { kind: "empty" };
export type Tree = Split | Leaf | Empty;

export type Notice = {
  id: string;
  title: string;
  body: string;
  tone: "blue" | "green" | "orange" | "cyan";
  at: number;
};

export type OsState = {
  phase: Phase;
  themeId: string;
  workspace: number;
  windows: Win[];
  trees: Record<number, Tree>;
  focused: string | null;
  launcher: boolean;
  cheatsheet: boolean;
  notices: Notice[];
  stickySuper: boolean;
  gaps: boolean;
  barHidden: boolean;
  fsEpoch: number;
};
