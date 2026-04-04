"use client";

import { useApp } from "@/context/AppContext";
import { GitBranch, Loader2, MessageCircle } from "lucide-react";
import RootNode from "./RootNode";
import BranchCard from "./BranchCard";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatIfScreen() {
  const { state, setTab } = useApp();
  const { currentTree, isTreeLoading } = state;

  // Loading state
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

  // Empty state — no tree generated yet
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

  // Tree visualization
  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Situation summary */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-sm text-text-muted"
        >
          {currentTree.situation}
        </motion.p>

        {/* Root node */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RootNode root={currentTree.root} />
        </motion.div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="h-10 w-px bg-border" />
        </div>

        {/* Branch split indicator */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-lavender-light px-4 py-1.5">
            <GitBranch className="h-3.5 w-3.5 text-lavender" />
            <span className="text-xs font-medium text-lavender">
              Alternative paths
            </span>
          </div>
        </div>

        {/* Connector lines to branches */}
        <div className="flex justify-center">
          <svg
            width="600"
            height="40"
            viewBox="0 0 600 40"
            className="mx-auto max-w-full"
          >
            <motion.path
              d="M300 0 L100 40"
              stroke="#E5E7EB"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />
            <motion.path
              d="M300 0 L300 40"
              stroke="#E5E7EB"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
            <motion.path
              d="M300 0 L500 40"
              stroke="#E5E7EB"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
          </svg>
        </div>

        {/* Branch cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AnimatePresence>
            {currentTree.branches.map((branch, i) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
              >
                <BranchCard branch={branch} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
