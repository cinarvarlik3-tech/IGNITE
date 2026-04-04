"use client";

import { motion } from "framer-motion";

const W = 600;

function connectorPaths(
  branchCount: number,
  h: number,
  originXFraction: number
): string[] {
  if (branchCount < 2) return [];
  const cx = originXFraction * W;
  return Array.from({ length: branchCount }, (_, i) => {
    const tx = ((2 * i + 1) / (2 * branchCount)) * W;
    return `M ${cx} 0 L ${tx} ${h}`;
  });
}

export default function BranchConnector({
  branchCount,
  dense = false,
  /** 0–1: horizontal start of fan (parent column center / full tree width). Default 0.5. */
  originXFraction = 0.5,
}: {
  branchCount: number;
  dense?: boolean;
  originXFraction?: number;
}) {
  const h = dense ? 16 : 32;
  const ox = Math.min(0.98, Math.max(0.02, originXFraction));
  const paths = connectorPaths(branchCount, h, ox);
  if (paths.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 justify-center">
      <svg
        width={W}
        height={h}
        viewBox={`0 0 ${W} ${h}`}
        aria-hidden
        className="h-auto w-full max-w-full min-w-0"
      >
        {paths.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke="#E5E7EB"
            strokeWidth={dense ? 1.25 : 1.5}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
          />
        ))}
      </svg>
    </div>
  );
}
