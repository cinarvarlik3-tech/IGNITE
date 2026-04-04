"use client";

import { useApp } from "@/context/AppContext";
import { GitBranch, Loader2, MessageCircle } from "lucide-react";
import RootNode from "./RootNode";
import HierarchicalOutcomeTree from "./HierarchicalOutcomeTree";
import { motion } from "framer-motion";

export default function WhatIfScreen() {
  const { state, setTab, removeTreeNodesWithDescendants } = useApp();
  const { currentTree, isTreeLoading } = state;

  if (isTreeLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-lavender" />
        </motion.div>
        <p className="text-text-muted">Mapping out alternative paths...</p>
      </div>
    );
  }

  if (!currentTree) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="rounded-2xl bg-lavender-light p-4">
          <GitBranch className="h-8 w-8 text-lavender" />
        </div>
        <h2 className="text-xl font-semibold text-text">No tree yet</h2>
        <p className="max-w-sm text-text-muted">
          Start a conversation in the Chat tab, then tap &quot;See alternative
          outcomes&quot; to visualize different paths.
        </p>
        <button
          onClick={() => setTab("chat")}
          className="mt-2 flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-teal-dark"
        >
          <MessageCircle className="h-4 w-4" />
          Go to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mx-auto min-h-0 w-full min-w-0 max-w-[min(100%,96rem)] flex-1 overflow-auto px-3 py-3 sm:px-5 sm:py-4">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 line-clamp-2 text-center text-[11px] leading-snug text-text-muted sm:text-xs"
        >
          {currentTree.situation}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-w-0"
        >
          <RootNode root={currentTree.root} slim />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="min-w-0"
        >
          <HierarchicalOutcomeTree
            tree={currentTree}
            variant="compact"
            onDeleteOutcome={removeTreeNodesWithDescendants}
          />
        </motion.div>
      </div>
    </div>
  );
}
