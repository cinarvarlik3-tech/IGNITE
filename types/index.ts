// ─── Chat ───────────────────────────────────────────

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── What-If Tree ───────────────────────────────────

export interface WhatIfTree {
  situation: string;
  root: TreeRoot;
  /** Flat forest: parentId null = alternative from scenario root; else id of parent outcome */
  nodes: TreeNode[];
  generatedAt: string;
}

export interface TreeRoot {
  title: string;
  description: string;
  emotion: string;
}

export interface TreeNode {
  id: string;
  /** null = direct alternative to “what actually happened”; otherwise parent outcome id */
  parentId: string | null;
  title: string;
  description: string;
  emotion: string;
  likelihood: "likely" | "possible" | "unlikely";
  insight: string;
}

/** Alias for journal / selection APIs */
export type Branch = TreeNode;

// ─── Journal ────────────────────────────────────────

export type MoodKey =
  | "calm"
  | "anxious"
  | "determined"
  | "low"
  | "reflective"
  | "hopeful";

export interface JournalEntryAnalysis {
  reflection: string;
  /** Three lines, newline-separated */
  haiku: string;
  feelings: string[];
  people: string[];
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  mood: MoodKey;
  createdAt: string;
  linkedBranch?: {
    title: string;
    description: string;
  };
  /** Short title for list + header; derived on save if omitted */
  displayTitle?: string;
  analysis?: JournalEntryAnalysis;
}

// ─── Chat Session ────────────────────────────────────

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  currentTree: WhatIfTree | null;
  /** After first successful create-tree; persisted for session bookkeeping */
  treeCreationDone?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── App State ──────────────────────────────────────

export type ActiveTab = "chat" | "whatif" | "journal" | "dashboard";

export interface AppState {
  messages: Message[];
  isStreaming: boolean;
  currentTree: WhatIfTree | null;
  isTreeLoading: boolean;
  selectedBranch: Branch | null;
  entries: JournalEntry[];
  draftEntry: Partial<JournalEntry> | null;
  activeTab: ActiveTab;
  shardBalance: number;
}
