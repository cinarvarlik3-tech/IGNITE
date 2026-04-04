import type { TreeNode, TreeRoot, WhatIfTree } from "@/types";

const ROOT_SENTINEL = "__scenario_root__";

/** Coerce API/legacy fields into a TreeNode */
export function normalizeTreeNode(raw: Record<string, unknown>): TreeNode | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  let parentId: string | null = null;
  if (raw.parentId === null || raw.parentId === undefined || raw.parentId === "null") {
    parentId = null;
  } else if (typeof raw.parentId === "string") {
    parentId = raw.parentId;
  } else if (typeof raw.parentBranchId === "string") {
    parentId = raw.parentBranchId;
  }
  const title = typeof raw.title === "string" ? raw.title : "";
  const description = typeof raw.description === "string" ? raw.description : "";
  const emotion = typeof raw.emotion === "string" ? raw.emotion : "reflective";
  const insight = typeof raw.insight === "string" ? raw.insight : "";
  const likelihood =
    raw.likelihood === "likely" ||
    raw.likelihood === "possible" ||
    raw.likelihood === "unlikely"
      ? raw.likelihood
      : "possible";
  return {
    id,
    parentId,
    title,
    description,
    emotion,
    likelihood,
    insight,
  };
}

/**
 * Migrate legacy `{ branches, parentBranchId }` to `{ nodes, parentId }`.
 */
export function normalizeWhatIfTree(raw: unknown): WhatIfTree | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.situation !== "string" || !t.root || typeof t.root !== "object") {
    return null;
  }
  const root = t.root as TreeRoot;
  let nodes: TreeNode[] = [];

  if (Array.isArray(t.nodes)) {
    for (const item of t.nodes) {
      if (item && typeof item === "object") {
        const n = normalizeTreeNode(item as Record<string, unknown>);
        if (n) nodes.push(n);
      }
    }
  } else if (Array.isArray(t.branches)) {
    for (const item of t.branches) {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const n = normalizeTreeNode({
          ...o,
          parentId:
            o.parentId !== undefined
              ? o.parentId
              : o.parentBranchId !== undefined
                ? o.parentBranchId
                : null,
        });
        if (n) nodes.push(n);
      }
    }
  }

  if (nodes.length === 0) return null;

  const generatedAt =
    typeof t.generatedAt === "string" ? t.generatedAt : new Date().toISOString();

  return {
    situation: t.situation,
    root,
    nodes,
    generatedAt,
  };
}

export function stripTreeForApiPrompt(tree: WhatIfTree) {
  return {
    situation: tree.situation,
    root: tree.root,
    nodes: tree.nodes.map((n) => ({
      id: n.id,
      parentId: n.parentId,
      title: n.title,
      description: n.description,
      emotion: n.emotion,
      likelihood: n.likelihood,
      insight: n.insight,
    })),
  };
}

/**
 * IDs from the top-level outcome (parentId null) down to `nodeId`, inclusive.
 * Returns null if the node is missing.
 */
export function ancestryPathFromRoot(
  nodes: TreeNode[],
  nodeId: string | null
): string[] | null {
  if (!nodeId) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur = byId.get(nodeId);
  if (!cur) return null;
  const up: string[] = [];
  while (cur) {
    up.push(cur.id);
    if (cur.parentId === null) break;
    cur = byId.get(cur.parentId);
  }
  up.reverse();
  return up;
}

/** Child of `nodeId` that continues toward the path tip, or null if none / not on path. */
export function nextChildOnPath(
  nodeId: string,
  pathFromRoot: string[]
): string | null {
  const i = pathFromRoot.indexOf(nodeId);
  if (i === -1 || i >= pathFromRoot.length - 1) return null;
  return pathFromRoot[i + 1];
}

/** Children of `parentId` in stable document order */
export function orderedChildren(
  nodes: TreeNode[],
  parentId: string | null
): TreeNode[] {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  return nodes
    .filter((n) => (n.parentId ?? null) === parentId)
    .sort((a, b) => (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0));
}

/** Recursive count of descendants (excluding the node itself) */
export function countDescendants(nodeId: string, nodes: TreeNode[]): number {
  const set = collectSubtreeIdsIncludingSelf(nodeId, nodes);
  return Math.max(0, set.size - 1);
}

/** This node plus every descendant id */
export function collectSubtreeIdsIncludingSelf(
  rootId: string,
  nodes: TreeNode[]
): Set<string> {
  const byParent = new Map<string, TreeNode[]>();
  for (const n of nodes) {
    const key = n.parentId === null ? ROOT_SENTINEL : n.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }
  const out = new Set<string>();
  function walk(id: string) {
    out.add(id);
    for (const c of byParent.get(id) ?? []) {
      walk(c.id);
    }
  }
  walk(rootId);
  return out;
}

const MAX_TREE_NODES = 1000;

export function validateTreeNodes(nodes: TreeNode[]): {
  ok: boolean;
  error?: string;
} {
  if (nodes.length > MAX_TREE_NODES) {
    return { ok: false, error: `Tree exceeds maximum of ${MAX_TREE_NODES} outcomes` };
  }
  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) return { ok: false, error: "Duplicate node id" };
    ids.add(n.id);
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots = nodes.filter((n) => n.parentId === null);
  if (roots.length < 3) {
    return { ok: false, error: "At least 3 top-level outcomes (parentId null) required" };
  }
  for (const n of nodes) {
    if (n.parentId !== null && !byId.has(n.parentId)) {
      return { ok: false, error: `Invalid parentId: ${n.parentId}` };
    }
  }
  for (const n of nodes) {
    const seen = new Set<string>();
    let cur: TreeNode | undefined = n;
    let guard = 0;
    while (cur && guard++ < nodes.length + 2) {
      if (seen.has(cur.id)) return { ok: false, error: "Cycle detected" };
      seen.add(cur.id);
      if (cur.parentId === null) break;
      cur = byId.get(cur.parentId);
      if (!cur) return { ok: false, error: "Broken parent chain" };
    }
    if (guard > nodes.length + 1) return { ok: false, error: "Cycle detected" };
  }
  return { ok: true };
}

/** Expand responses must keep every existing node id (new nodes may be added). */
export function validateExpandPreservesPrevious(
  previous: TreeNode[],
  next: TreeNode[]
): { ok: boolean; error?: string } {
  const nextIds = new Set(next.map((n) => n.id));
  for (const p of previous) {
    if (!nextIds.has(p.id)) {
      return {
        ok: false,
        error: `Expand must preserve every existing node id; missing "${p.id}"`,
      };
    }
  }
  return { ok: true };
}
