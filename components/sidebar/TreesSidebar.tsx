"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  GitBranch,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
} from "lucide-react";
import RootNode from "@/components/whatif/RootNode";
import HierarchicalOutcomeTree from "@/components/whatif/HierarchicalOutcomeTree";
import { motion } from "framer-motion";

// ─── Animation constants ─────────────────────────────
// These are CSS custom property values; JS only needs them for the
// delayed-visibility trick on close. Keep in sync with globals.css :root.
const SIDEBAR_DURATION_MS = 280;
const SIDEBAR_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

// ─── Component ───────────────────────────────────────

export default function TreesSidebar() {
  const { state, setTab, closeTreeSidebar, removeTreeNodesWithDescendants } =
    useApp();
  const { isTreeSidebarOpen, currentTree, isTreeLoading } = state;
  const [expanded, setExpanded] = useState(true);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Reset to expanded whenever the sidebar (re-)opens
  useEffect(() => {
    if (isTreeSidebarOpen) setExpanded(true);
  }, [isTreeSidebarOpen]);

  // Move focus to the close button when the panel becomes fully open
  useEffect(() => {
    if (!isTreeSidebarOpen || !expanded) return;
    // Defer until after the CSS transition begins so the element is visible
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isTreeSidebarOpen]);

  // ESC → close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTreeSidebarOpen) {
        e.stopPropagation();
        closeTreeSidebar();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isTreeSidebarOpen, closeTreeSidebar]);

  // ── Derived widths ──
  const targetWidth = !isTreeSidebarOpen
    ? "0px"
    : expanded
    ? "50%"
    : "2.5rem";

  // ── CSS transition strategy ──────────────────────────────────────────────
  //
  // For width:  always animate over SIDEBAR_DURATION_MS with the shared easing.
  // For visibility: when OPENING  → visible immediately (delay 0)
  //                 when CLOSING  → hidden AFTER the width animation ends (delay = duration)
  //
  // This means elements inside are never focusable while the sidebar is
  // visually hidden, solving the keyboard-accessibility gap that would arise
  // from the always-mounted approach.
  // ──────────────────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = isTreeSidebarOpen
    ? {
        width: targetWidth,
        visibility: "visible",
        transition: `width ${SIDEBAR_DURATION_MS}ms ${SIDEBAR_EASING}`,
      }
    : {
        width: "0px",
        visibility: "hidden",
        transition: `width ${SIDEBAR_DURATION_MS}ms ${SIDEBAR_EASING}, visibility 0ms linear ${SIDEBAR_DURATION_MS}ms`,
      };

  return (
    <div
      role="complementary"
      aria-label="Outcomes Tree"
      aria-hidden={!isTreeSidebarOpen}
      style={containerStyle}
      className="flex h-full shrink-0 overflow-hidden border-l border-border bg-card"
    >
      {/*
       * Inner row is always full-width of the outer container.
       * When outer = 2.5rem (collapsed), only the 40px toggle strip is visible;
       * the main content overflows and is clipped by overflow:hidden on the outer.
       */}
      <div className="flex h-full w-full">
        {/* ── Toggle strip (always 40 px, always visible when sidebar > 0) ── */}
        <div className="flex w-10 shrink-0 flex-col items-center justify-center border-r border-border">
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse tree (or press Esc to close)" : "Expand tree"}
            tabIndex={isTreeSidebarOpen ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-teal-light hover:text-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {expanded ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* ── Main panel content ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-lavender" />
              <span className="text-sm font-semibold text-text">
                Outcomes Tree
              </span>
            </div>
            <button
              ref={closeBtnRef}
              onClick={closeTreeSidebar}
              tabIndex={isTreeSidebarOpen && expanded ? 0 : -1}
              title="Close (Esc)"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-gray-100 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tree may be wider than panel — scroll horizontally and vertically */}
          <div className="min-h-0 flex-1 overflow-auto">
            {isTreeLoading ? (
              /* ── Loading ── */
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-8 w-8 text-lavender" />
                </motion.div>
                <p className="text-sm text-text-muted">
                  Mapping out alternative paths…
                </p>
              </div>
            ) : !currentTree ? (
              /* ── Empty ── */
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-2xl bg-lavender-light p-3">
                  <GitBranch className="h-6 w-6 text-lavender" />
                </div>
                <p className="text-sm text-text-muted">
                  Generate a tree from your conversation to see it here.
                </p>
                <button
                  onClick={() => setTab("chat")}
                  tabIndex={isTreeSidebarOpen ? 0 : -1}
                  className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Go to Chat
                </button>
              </div>
            ) : (
              /* ── Tree ── */
              <div className="min-w-0 px-3 py-3">
                {/* Situation summary */}
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 line-clamp-2 text-center text-[11px] leading-snug text-text-muted"
                >
                  {currentTree.situation}
                </motion.p>

                {/* Root node */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <RootNode root={currentTree.root} slim />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <HierarchicalOutcomeTree
                    tree={currentTree}
                    variant="compact"
                    onDeleteOutcome={removeTreeNodesWithDescendants}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
