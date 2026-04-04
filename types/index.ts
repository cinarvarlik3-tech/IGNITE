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
  branches: Branch[];
  generatedAt: string;
}

export interface TreeRoot {
  title: string;
  description: string;
  emotion: string;
}

export interface Branch {
  id: string;
  title: string;
  description: string;
  emotion: string;
  likelihood: "likely" | "possible" | "unlikely";
  insight: string;
}

// ─── Journal ────────────────────────────────────────

export type MoodKey =
  | "calm"
  | "anxious"
  | "determined"
  | "low"
  | "reflective"
  | "hopeful";

export interface JournalEntry {
  id: string;
  text: string;
  mood: MoodKey;
  createdAt: string;
  linkedBranch?: {
    title: string;
    description: string;
  };
}

// ─── Chat Session ────────────────────────────────────

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  currentTree: WhatIfTree | null;
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
