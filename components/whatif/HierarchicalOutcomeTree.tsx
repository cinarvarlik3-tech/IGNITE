"use client";

import {
  Children,
  Fragment,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { WhatIfTree, TreeNode } from "@/types";
import { GitBranch } from "lucide-react";
import {
  orderedChildren,
  countDescendants,
  ancestryPathFromRoot,
  nextChildOnPath,
} from "@/lib/tree-utils";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import BranchCard from "./BranchCard";
import BranchConnector from "./BranchConnector";
import CollapsedBranchHeader from "./CollapsedBranchHeader";

const MAX_CANVAS_PX = 2400;
/** Max fraction of breakout width used as (pl+pr) for lateral bias */
const BIAS_PAD_FRAC_MAX = 0.14;

function layoutConstants(variant: "comfortable" | "compact") {
  const compact = variant === "compact";
  return {
    colMin: compact ? 132 : 160,
    gap: compact ? 10 : 12,
    biasPadMax: compact ? 0.11 : BIAS_PAD_FRAC_MAX,
  };
}

function minWidthForRow(k: number, gap: number, colMin: number): number {
  if (k <= 0) return 0;
  return k * colMin + Math.max(0, k - 1) * gap;
}

/** Widest row (roots or any sibling group) — drives minimum canvas width */
function treeMinCanvasPx(nodes: TreeNode[], colMin: number, gap: number): number {
  const roots = orderedChildren(nodes, null);
  let maxW = minWidthForRow(roots.length, gap, colMin);
  function walk(node: TreeNode) {
    const ch = orderedChildren(nodes, node.id);
    if (ch.length > 0) {
      maxW = Math.max(maxW, minWidthForRow(ch.length, gap, colMin));
      ch.forEach(walk);
    }
  }
  roots.forEach(walk);
  return Math.max(maxW, 280);
}

function breakoutWidthMult(pathBranchCounts: number[]): number {
  return pathBranchCounts.reduce((a, b) => a * b, 1);
}

function breakoutOffset(pathIndices: number[], pathBranchCounts: number[]): number {
  let off = 0;
  for (let L = 0; L < pathIndices.length; L++) {
    let prod = 1;
    for (let j = L + 1; j < pathBranchCounts.length; j++) {
      prod *= pathBranchCounts[j];
    }
    off += pathIndices[L] * prod;
  }
  return off;
}

/** [-1, 1]: left roots negative, center 0, right positive */
function rootBiasNormalized(rootIndex: number, totalRoots: number): number {
  if (totalRoots <= 1) return 0;
  const center = (totalRoots - 1) / 2;
  const denom = Math.max(center, totalRoots - 1 - center, 0.5);
  return (rootIndex - center) / denom;
}

/** Asymmetric horizontal padding (fraction of breakout width) — left roots lean left, etc. */
function biasPaddingFrac(
  rootIndex: number,
  totalRoots: number,
  parentDepth: number,
  padMax: number
): { pl: number; pr: number } {
  const nd = rootBiasNormalized(rootIndex, totalRoots);
  const decay = 1 / (parentDepth + 1);
  const scale = padMax * decay;
  const pl = ((nd + 1) / 2) * scale;
  const pr = ((1 - nd) / 2) * scale;
  return { pl, pr };
}

/** Parent column center in breakout [0,1], adjusted for asymmetric padding of inner content */
function originAfterPadding(
  off: number,
  wMult: number,
  pl: number,
  pr: number
): number {
  const f = (off + 0.5) / wMult;
  const inner = 1 - pl - pr;
  if (inner <= 0.05) return Math.min(0.98, Math.max(0.02, f));
  return Math.min(0.98, Math.max(0.02, (f - pl) / inner));
}

function SiblingPathRow({
  children,
  variant,
  labelId,
  colMin,
  gapPx,
}: {
  children: ReactNode;
  variant: "comfortable" | "compact";
  labelId?: string;
  colMin: number;
  gapPx: number;
}) {
  const n = Children.toArray(children).length;
  const cols = Math.max(n, 1);

  return (
    <div
      className="w-full min-w-0 pb-1.5"
      role="group"
      aria-labelledby={labelId}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(${colMin}px, 1fr))`,
        gap: gapPx,
      }}
    >
      {children}
    </div>
  );
}

/** Flex row when path-collapse is on — wide column for active path, narrow for others */
function CollapseSiblingRow({
  children,
  gapPx,
}: {
  children: ReactNode;
  gapPx: number;
}) {
  return (
    <div
      className="flex w-full min-w-0 flex-wrap items-stretch justify-center pb-1.5"
      style={{ gap: gapPx }}
    >
      {children}
    </div>
  );
}

function collapsedColumnStyle(colMin: number): CSSProperties {
  return {
    maxWidth: "min(100%, 7rem)",
    minWidth: Math.min(100, Math.max(72, Math.round(colMin * 0.45))),
  };
}

function expandedColumnStyle(colMin: number): CSSProperties {
  return { minWidth: colMin };
}

function OutcomeColumn({
  node,
  allNodes,
  variant,
  onDeleteOutcome,
  pathFromRoot,
  selectedId,
  pathIndices,
  pathBranchCounts,
  totalRoots,
  colMin,
  gapPx,
  biasPadMax,
}: {
  node: TreeNode;
  allNodes: TreeNode[];
  variant: "comfortable" | "compact";
  onDeleteOutcome?: (nodeId: string) => void;
  pathFromRoot: string[] | null;
  selectedId: string | null;
  pathIndices: number[];
  pathBranchCounts: number[];
  totalRoots: number;
  colMin: number;
  gapPx: number;
  biasPadMax: number;
}) {
  const pathCollapseActive =
    selectedId !== null &&
    pathFromRoot !== null &&
    pathFromRoot.length > 0;

  const children = orderedChildren(allNodes, node.id);
  const descendantCount = countDescendants(node.id, allNodes);
  const rootIndex = pathIndices[0] ?? 0;
  const parentDepth = pathIndices.length - 1;
  const childPathBranchCounts = pathCollapseActive
    ? [1]
    : children.length > 0
      ? [...pathBranchCounts, children.length]
      : pathBranchCounts;

  const wMult = pathCollapseActive
    ? 1
    : breakoutWidthMult(pathBranchCounts);
  const off = pathCollapseActive ? 0 : breakoutOffset(pathIndices, pathBranchCounts);
  const { pl, pr } =
    pathCollapseActive
      ? { pl: 0, pr: 0 }
      : children.length > 0
        ? biasPaddingFrac(rootIndex, totalRoots, parentDepth, biasPadMax)
        : { pl: 0, pr: 0 };
  const originX =
    children.length > 0 && wMult > 0
      ? originAfterPadding(off, wMult, pl, pr)
      : wMult > 0
        ? (off + 0.5) / wMult
        : 0.5;

  const isSelectedNode = selectedId !== null && node.id === selectedId;
  const nextOnPathChild =
    pathCollapseActive && !isSelectedNode
      ? nextChildOnPath(node.id, pathFromRoot!)
      : null;

  const renderChildSlot = (c: TreeNode, i: number) => {
    const useCollapsed =
      pathCollapseActive &&
      !isSelectedNode &&
      nextOnPathChild !== null &&
      c.id !== nextOnPathChild;

    if (useCollapsed) {
      const inner = (
        <CollapsedBranchHeader
          branch={c}
          variant={variant}
          onDeleteOutcome={onDeleteOutcome}
          descendantCount={countDescendants(c.id, allNodes)}
        />
      );
      return (
        <div
          key={c.id}
          className="shrink-0"
          style={collapsedColumnStyle(colMin)}
        >
          {inner}
        </div>
      );
    }

    const col = (
      <OutcomeColumn
        node={c}
        allNodes={allNodes}
        variant={variant}
        onDeleteOutcome={onDeleteOutcome}
        pathFromRoot={pathFromRoot}
        selectedId={selectedId}
        pathIndices={[...pathIndices, i]}
        pathBranchCounts={childPathBranchCounts}
        totalRoots={totalRoots}
        colMin={colMin}
        gapPx={gapPx}
        biasPadMax={biasPadMax}
      />
    );

    if (pathCollapseActive) {
      return (
        <div
          key={c.id}
          className="min-w-0 flex-1 basis-0"
          style={expandedColumnStyle(colMin)}
        >
          {col}
        </div>
      );
    }
    return <Fragment key={c.id}>{col}</Fragment>;
  };

  const breakoutBody = (
    <>
      <BranchConnector
        branchCount={children.length}
        dense
        originXFraction={originX}
      />
      {pathCollapseActive ? (
        <CollapseSiblingRow gapPx={gapPx}>
          {children.map((c, i) => renderChildSlot(c, i))}
        </CollapseSiblingRow>
      ) : (
        <SiblingPathRow variant={variant} colMin={colMin} gapPx={gapPx}>
          {children.map((c, i) => renderChildSlot(c, i))}
        </SiblingPathRow>
      )}
    </>
  );

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch">
      <BranchCard
        branch={node}
        variant={variant}
        onDeleteOutcome={onDeleteOutcome}
        descendantCount={descendantCount}
      />
      {children.length > 0 && (
        <>
          <div
            className={cn(
              "mx-auto w-px shrink-0 bg-border",
              variant === "compact" ? "h-3" : "h-5"
            )}
            aria-hidden
          />
          {pathCollapseActive ? (
            <div className="min-w-0 w-full">{breakoutBody}</div>
          ) : (
            <div
              className="min-w-0"
              style={{
                width: `calc(100% * ${wMult})`,
                marginLeft: `calc(-100% * (${off}))`,
              }}
            >
              <div
                className="box-border min-w-0 w-full"
                style={{
                  paddingLeft: `${pl * 100}%`,
                  paddingRight: `${pr * 100}%`,
                }}
              >
                {breakoutBody}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface Props {
  tree: WhatIfTree;
  variant?: "comfortable" | "compact";
  onDeleteOutcome?: (nodeId: string) => void;
}

export default function HierarchicalOutcomeTree({
  tree,
  variant = "comfortable",
  onDeleteOutcome,
}: Props) {
  const { state, selectBranch } = useApp();
  const selectedId = state.selectedBranch?.id ?? null;
  const pathFromRoot = ancestryPathFromRoot(tree.nodes, selectedId);

  const pathCollapseActive =
    selectedId !== null &&
    pathFromRoot !== null &&
    pathFromRoot.length > 0;

  const roots = orderedChildren(tree.nodes, null);
  const pathsLabelId = useId();
  const tr = roots.length;
  const { colMin, gap: gapPx, biasPadMax } = layoutConstants(variant);
  const minCanvasPx = treeMinCanvasPx(tree.nodes, colMin, gapPx);

  const hostRef = useRef<HTMLDivElement>(null);
  const [measuredW, setMeasuredW] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setMeasuredW(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setMeasuredW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const canvasWidthPx = Math.min(
    MAX_CANVAS_PX,
    Math.max(minCanvasPx, measuredW || minCanvasPx)
  );

  if (roots.length === 0) return null;

  const continuingRootId =
    pathCollapseActive &&
    pathFromRoot &&
    roots.some((r) => r.id === pathFromRoot[0])
      ? pathFromRoot[0]
      : null;

  return (
    <div ref={hostRef} className="w-full min-w-0">
      <div className="mx-auto min-w-0" style={{ width: canvasWidthPx }}>
        <div className="flex justify-center">
          <div
            className={cn(
              "w-px bg-border",
              variant === "compact" ? "h-4" : "h-8"
            )}
            aria-hidden
          />
        </div>
        <div className="flex flex-col items-center gap-0">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full bg-lavender-light px-2 py-0.5",
              variant === "comfortable" && "gap-1.5 px-3 py-1"
            )}
          >
            <GitBranch
              className={cn(
                "text-lavender",
                variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
              )}
            />
            <span className="text-[11px] font-medium text-lavender sm:text-xs">
              Alternative paths
            </span>
          </div>
          <p
            id={pathsLabelId}
            className={cn(
              "text-center leading-tight text-text-muted",
              variant === "compact"
                ? "max-w-full px-0.5 text-[9px] sm:text-[10px]"
                : "text-[10px] sm:text-[11px]"
            )}
          >
            {pathCollapseActive
              ? "Off-path branches collapse — tap a header to switch paths."
              : "Side-by-side columns — each is a different path"}
          </p>
          {pathCollapseActive && (
            <button
              type="button"
              onClick={() => selectBranch(null)}
              className="mt-1 text-[10px] font-medium text-lavender underline-offset-2 hover:underline sm:text-[11px]"
            >
              Show all branches
            </button>
          )}
        </div>
        <BranchConnector branchCount={roots.length} dense />
        {pathCollapseActive && continuingRootId != null ? (
          <CollapseSiblingRow gapPx={gapPx}>
            {roots.map((node, r) =>
              node.id !== continuingRootId ? (
                <div
                  key={node.id}
                  className="shrink-0"
                  style={collapsedColumnStyle(colMin)}
                >
                  <CollapsedBranchHeader
                    branch={node}
                    variant={variant}
                    onDeleteOutcome={onDeleteOutcome}
                    descendantCount={countDescendants(node.id, tree.nodes)}
                  />
                </div>
              ) : (
                <div
                  key={node.id}
                  className="min-w-0 flex-1 basis-0"
                  style={expandedColumnStyle(colMin)}
                >
                  <OutcomeColumn
                    node={node}
                    allNodes={tree.nodes}
                    variant={variant}
                    onDeleteOutcome={onDeleteOutcome}
                    pathFromRoot={pathFromRoot}
                    selectedId={selectedId}
                    pathIndices={[r]}
                    pathBranchCounts={[tr]}
                    totalRoots={tr}
                    colMin={colMin}
                    gapPx={gapPx}
                    biasPadMax={biasPadMax}
                  />
                </div>
              )
            )}
          </CollapseSiblingRow>
        ) : (
          <SiblingPathRow
            variant={variant}
            labelId={pathsLabelId}
            colMin={colMin}
            gapPx={gapPx}
          >
            {roots.map((node, r) => (
              <OutcomeColumn
                key={node.id}
                node={node}
                allNodes={tree.nodes}
                variant={variant}
                onDeleteOutcome={onDeleteOutcome}
                pathFromRoot={pathFromRoot}
                selectedId={selectedId}
                pathIndices={[r]}
                pathBranchCounts={[tr]}
                totalRoots={tr}
                colMin={colMin}
                gapPx={gapPx}
                biasPadMax={biasPadMax}
              />
            ))}
          </SiblingPathRow>
        )}
      </div>
    </div>
  );
}
