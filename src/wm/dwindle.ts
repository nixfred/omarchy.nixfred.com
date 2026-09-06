import type { Rect, Tree } from "../os/types";

export const empty = (): Tree => ({ kind: "empty" });

export function contains(tree: Tree, id: string | null): boolean {
  if (!id || tree.kind === "empty") return false;
  if (tree.kind === "leaf") return tree.id === id;
  return contains(tree.first, id) || contains(tree.second, id);
}

export function ids(tree: Tree): string[] {
  if (tree.kind === "empty") return [];
  if (tree.kind === "leaf") return [tree.id];
  return [...ids(tree.first), ...ids(tree.second)];
}

export function insert(tree: Tree, newId: string, focusId: string | null, rects: Record<string, Rect>): Tree {
  if (tree.kind === "empty") return { kind: "leaf", id: newId };
  if (tree.kind === "leaf") {
    const r = rects[tree.id];
    const dir: "h" | "v" = !r || r.w >= r.h ? "v" : "h";
    return { kind: "split", dir, ratio: 0.5, first: tree, second: { kind: "leaf", id: newId } };
  }
  if (contains(tree.first, focusId)) return { ...tree, first: insert(tree.first, newId, focusId, rects) };
  if (contains(tree.second, focusId)) return { ...tree, second: insert(tree.second, newId, focusId, rects) };
  const r = Object.values(rects)[0];
  const dir: "h" | "v" = !r || r.w >= r.h ? "v" : "h";
  return { kind: "split", dir, ratio: 0.5, first: tree, second: { kind: "leaf", id: newId } };
}

export function remove(tree: Tree, id: string): Tree {
  if (tree.kind === "empty") return tree;
  if (tree.kind === "leaf") return tree.id === id ? empty() : tree;
  const first = remove(tree.first, id);
  const second = remove(tree.second, id);
  if (first.kind === "empty") return second;
  if (second.kind === "empty") return first;
  return { ...tree, first, second };
}

export function swapIds(tree: Tree, a: string, b: string): Tree {
  if (tree.kind === "empty") return tree;
  if (tree.kind === "leaf") {
    if (tree.id === a) return { kind: "leaf", id: b };
    if (tree.id === b) return { kind: "leaf", id: a };
    return tree;
  }
  return { ...tree, first: swapIds(tree.first, a, b), second: swapIds(tree.second, a, b) };
}

export function layout(tree: Tree, rect: Rect, gap: number): Record<string, Rect> {
  if (tree.kind === "empty") return {};
  if (tree.kind === "leaf") {
    return {
      [tree.id]: {
        x: rect.x + gap,
        y: rect.y + gap,
        w: Math.max(40, rect.w - gap * 2),
        h: Math.max(40, rect.h - gap * 2),
      },
    };
  }
  const { dir, ratio, first, second } = tree;
  if (dir === "v") {
    const leftW = Math.round(rect.w * ratio);
    return {
      ...layout(first, { x: rect.x, y: rect.y, w: leftW, h: rect.h }, gap),
      ...layout(second, { x: rect.x + leftW, y: rect.y, w: rect.w - leftW, h: rect.h }, gap),
    };
  }
  const topH = Math.round(rect.h * ratio);
  return {
    ...layout(first, { x: rect.x, y: rect.y, w: rect.w, h: topH }, gap),
    ...layout(second, { x: rect.x, y: rect.y + topH, w: rect.w, h: rect.h - topH }, gap),
  };
}

export function nearest(rects: Record<string, Rect>, fromId: string, dir: "l" | "r" | "u" | "d"): string | null {
  const from = rects[fromId];
  if (!from) return null;
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const [id, r] of Object.entries(rects)) {
    if (id === fromId) continue;
    const ox = r.x + r.w / 2;
    const oy = r.y + r.h / 2;
    const dx = ox - cx;
    const dy = oy - cy;
    const aligned =
      dir === "l" ? dx < -8 && Math.abs(dy) < Math.abs(dx) * 2 :
      dir === "r" ? dx > 8 && Math.abs(dy) < Math.abs(dx) * 2 :
      dir === "u" ? dy < -8 && Math.abs(dx) < Math.abs(dy) * 2 :
      dy > 8 && Math.abs(dx) < Math.abs(dy) * 2;
    if (!aligned) continue;
    const score = Math.hypot(dx, dy);
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

export function resizeToward(tree: Tree, id: string, dir: "l" | "r" | "u" | "d", delta = 0.04): Tree {
  if (tree.kind !== "split") return tree;
  if (tree.dir === "v" && (dir === "l" || dir === "r") && (contains(tree.first, id) || contains(tree.second, id))) {
    const onFirst = contains(tree.first, id);
    const sign = (dir === "r" ? 1 : -1) * (onFirst ? 1 : -1);
    const ratio = Math.min(0.8, Math.max(0.2, tree.ratio + sign * delta));
    return { ...tree, ratio };
  }
  if (tree.dir === "h" && (dir === "u" || dir === "d") && (contains(tree.first, id) || contains(tree.second, id))) {
    const onFirst = contains(tree.first, id);
    const sign = (dir === "d" ? 1 : -1) * (onFirst ? 1 : -1);
    const ratio = Math.min(0.8, Math.max(0.2, tree.ratio + sign * delta));
    return { ...tree, ratio };
  }
  return {
    ...tree,
    first: resizeToward(tree.first, id, dir, delta),
    second: resizeToward(tree.second, id, dir, delta),
  };
}
