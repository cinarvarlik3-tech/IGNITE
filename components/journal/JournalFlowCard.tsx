"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Matches the journal editor preview shell in JournalScreen (max-w-2xl card).
 */
export default function JournalFlowCard({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  /** Applied to the inner bordered card (e.g. overflow-y-auto vs overflow-hidden). */
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:px-0",
        className
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
