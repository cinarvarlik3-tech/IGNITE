"use client";

import { TreePine } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-light">
        <TreePine className="h-4 w-4 text-teal" />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
        <div className="flex gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
          <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
          <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
        </div>
      </div>
    </div>
  );
}
