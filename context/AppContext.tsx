"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  Message,
  WhatIfTree,
  Branch,
  JournalEntry,
  JournalEntryAnalysis,
  ActiveTab,
  MoodKey,
  ChatSession,
} from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { deriveDisplayTitle } from "@/lib/journal-utils";
import { streamChat, createOutcomesTree, expandOutcomesTree } from "@/lib/openai";
import { shouldShowOutcomesButton } from "@/lib/chat-outcomes";
import {
  normalizeWhatIfTree,
  collectSubtreeIdsIncludingSelf,
} from "@/lib/tree-utils";

// ─── State ──────────────────────────────────────────

interface State {
  // Active working session
  messages: Message[];
  isStreaming: boolean;
  currentTree: WhatIfTree | null;
  isTreeLoading: boolean;
  selectedBranch: Branch | null;
  // Journal
  entries: JournalEntry[];
  draftEntry: Partial<JournalEntry> | null;
  // Navigation
  activeTab: ActiveTab;
  // Multi-session
  sessions: ChatSession[];
  activeSessionId: string | null;
  // Right sidebar
  isTreeSidebarOpen: boolean;
  /** In-app currency; persists in localStorage */
  shardBalance: number;
}

const initialState: State = {
  messages: [],
  isStreaming: false,
  currentTree: null,
  isTreeLoading: false,
  selectedBranch: null,
  entries: [],
  draftEntry: null,
  activeTab: "chat",
  sessions: [],
  activeSessionId: null,
  isTreeSidebarOpen: false,
  shardBalance: 1500,
};

// ─── Actions ────────────────────────────────────────

type Action =
  | { type: "SET_TAB"; tab: ActiveTab }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_LAST_ASSISTANT"; content: string }
  | { type: "SET_STREAMING"; value: boolean }
  | { type: "SET_TREE"; tree: WhatIfTree | null }
  | { type: "SET_TREE_LOADING"; value: boolean }
  | { type: "SELECT_BRANCH"; branch: Branch | null }
  | { type: "ADD_ENTRY"; entry: JournalEntry }
  | { type: "UPDATE_JOURNAL_ENTRY"; id: string; patch: Partial<JournalEntry> }
  | { type: "DELETE_ENTRY"; id: string }
  | { type: "SET_DRAFT"; draft: Partial<JournalEntry> | null }
  | { type: "HYDRATE"; state: Partial<State> }
  | { type: "CLEAR_CHAT" }
  | { type: "NEW_CHAT"; session: ChatSession }
  | { type: "LOAD_SESSION"; session: ChatSession }
  | { type: "SAVE_SESSION" }
  | { type: "DELETE_SESSION"; id: string }
  | { type: "SET_SESSION_TITLE"; id: string; title: string }
  | { type: "SET_TREE_SIDEBAR"; open: boolean }
  | { type: "CONSUME_SHARDS"; amount?: number }
  | { type: "REMOVE_TREE_NODES"; nodeId: string }
  | { type: "MARK_TREE_INITIALIZED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };

    case "UPDATE_LAST_ASSISTANT": {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + action.content };
      }
      return { ...state, messages: msgs };
    }

    case "SET_STREAMING":
      return { ...state, isStreaming: action.value };

    case "SET_TREE":
      return { ...state, currentTree: action.tree };

    case "SET_TREE_LOADING":
      return { ...state, isTreeLoading: action.value };

    case "SELECT_BRANCH":
      return { ...state, selectedBranch: action.branch };

    case "ADD_ENTRY":
      return { ...state, entries: [action.entry, ...state.entries] };

    case "UPDATE_JOURNAL_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e
        ),
      };

    case "DELETE_ENTRY":
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };

    case "SET_DRAFT":
      return { ...state, draftEntry: action.draft };

    case "HYDRATE":
      return { ...state, ...action.state };

    case "SET_TREE_SIDEBAR":
      return { ...state, isTreeSidebarOpen: action.open };

    case "CONSUME_SHARDS": {
      const amount = action.amount ?? 2;
      return {
        ...state,
        shardBalance: Math.max(0, state.shardBalance - amount),
      };
    }

    case "CLEAR_CHAT": {
      const sessions = state.activeSessionId
        ? state.sessions.map((s) =>
            s.id === state.activeSessionId ? { ...s, treeCreationDone: false } : s
          )
        : state.sessions;
      return {
        ...state,
        sessions,
        messages: [],
        currentTree: null,
        selectedBranch: null,
        isTreeSidebarOpen: false,
      };
    }

    case "NEW_CHAT": {
      // Persist current session if it has messages
      const updatedSessions = persistCurrentSession(state);
      return {
        ...state,
        sessions: [action.session, ...updatedSessions],
        activeSessionId: action.session.id,
        messages: [],
        currentTree: null,
        selectedBranch: null,
        activeTab: "chat",
        isTreeSidebarOpen: false,
      };
    }

    case "LOAD_SESSION": {
      const updatedSessions = persistCurrentSession(state);
      const loadedTree = action.session.currentTree
        ? normalizeWhatIfTree(action.session.currentTree) ??
          action.session.currentTree
        : null;
      return {
        ...state,
        sessions: updatedSessions,
        activeSessionId: action.session.id,
        messages: action.session.messages,
        currentTree: loadedTree,
        selectedBranch: null,
        activeTab: "chat",
        isTreeSidebarOpen: false,
      };
    }

    case "REMOVE_TREE_NODES": {
      if (!state.currentTree) return state;
      const removeIds = collectSubtreeIdsIncludingSelf(
        action.nodeId,
        state.currentTree.nodes
      );
      const nodes = state.currentTree.nodes.filter((n) => !removeIds.has(n.id));
      const nextTree = { ...state.currentTree, nodes };
      const sel =
        state.selectedBranch && removeIds.has(state.selectedBranch.id)
          ? null
          : state.selectedBranch;
      return { ...state, currentTree: nextTree, selectedBranch: sel };
    }

    case "SAVE_SESSION": {
      if (!state.activeSessionId || state.messages.length === 0) return state;
      const now = new Date().toISOString();
      const updatedSessions = state.sessions.map((s) => {
        if (s.id !== state.activeSessionId) return s;
        const title = s.title || deriveTitle(state.messages);
        return {
          ...s,
          title,
          messages: state.messages,
          currentTree: state.currentTree,
          updatedAt: now,
        };
      });
      return { ...state, sessions: updatedSessions };
    }

    case "DELETE_SESSION": {
      const remaining = state.sessions.filter((s) => s.id !== action.id);
      // If deleted the active session, start fresh
      if (state.activeSessionId === action.id) {
        return {
          ...state,
          sessions: remaining,
          activeSessionId: null,
          messages: [],
          currentTree: null,
          selectedBranch: null,
          isTreeSidebarOpen: false,
        };
      }
      return { ...state, sessions: remaining };
    }

    case "SET_SESSION_TITLE": {
      const updatedSessions = state.sessions.map((s) =>
        s.id === action.id ? { ...s, title: action.title } : s
      );
      return { ...state, sessions: updatedSessions };
    }

    case "MARK_TREE_INITIALIZED": {
      if (!state.activeSessionId) return state;
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === state.activeSessionId ? { ...s, treeCreationDone: true } : s
        ),
      };
    }

    default:
      return state;
  }
}

// ─── Helpers ────────────────────────────────────────

function deriveTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const text = first.content.trim().replace(/\s+/g, " ");
  return text.length > 42 ? text.slice(0, 42) + "…" : text;
}

function normalizeStoredTree(tree: WhatIfTree | null): WhatIfTree | null {
  if (!tree) return null;
  return normalizeWhatIfTree(tree) ?? tree;
}

function withSessionTreeFlags(session: ChatSession): ChatSession {
  const t = normalizeStoredTree(session.currentTree);
  const hasNodes = !!t?.nodes?.length;
  return {
    ...session,
    treeCreationDone:
      session.treeCreationDone !== undefined ? session.treeCreationDone : hasNodes,
  };
}

function persistCurrentSession(state: State): ChatSession[] {
  if (!state.activeSessionId || state.messages.length === 0) return state.sessions;
  const now = new Date().toISOString();
  const exists = state.sessions.some((s) => s.id === state.activeSessionId);
  if (!exists) return state.sessions;
  return state.sessions.map((s) => {
    if (s.id !== state.activeSessionId) return s;
    const title = s.title || deriveTitle(state.messages);
    return {
      ...s,
      title,
      messages: state.messages,
      currentTree: state.currentTree,
      updatedAt: now,
    };
  });
}

// ─── Context ────────────────────────────────────────

interface AppContextValue {
  state: State;
  setTab: (tab: ActiveTab) => void;
  sendMessage: (content: string) => Promise<void>;
  /** `endIndexInclusive` — last message included in tree context (the assistant message whose button was pressed). */
  requestTree: (endIndexInclusive: number) => Promise<void>;
  selectBranch: (branch: Branch | null) => void;
  reflectOnBranch: (branch: Branch) => void;
  saveEntry: (
    text: string,
    mood: MoodKey,
    meta?: { analysis?: JournalEntryAnalysis; displayTitle?: string }
  ) => string;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  consumeShards: (amount?: number) => void;
  deleteEntry: (id: string) => void;
  clearDraft: () => void;
  /** Replace or clear the journal draft (e.g. guided flows). */
  setJournalDraft: (draft: Partial<JournalEntry> | null) => void;
  clearChat: () => void;
  newChat: () => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  openTreeSidebar: () => void;
  closeTreeSidebar: () => void;
  /** New empty chat + first user message with journal summary (after next paint). */
  startChatWithJournalSummary: (summary: string) => void;
  /** Remove one outcome and all nested sub-outcomes beneath it. */
  removeTreeNodesWithDescendants: (nodeId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ───────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const journalChatSeedRef = useRef<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const messages = storageGet<Message[]>("messages", []);
    const entries = storageGet<JournalEntry[]>("journal", []);
    const rawTree = storageGet<WhatIfTree | null>("tree", null);
    const currentTree = normalizeStoredTree(rawTree);
    const sessions = storageGet<ChatSession[]>("sessions", []);
    const shardBalance = storageGet("shards", 1500);

    // Migrate legacy single-session messages into a session if needed
    let hydratedSessions = sessions;
    let activeSessionId: string | null = null;

    if (sessions.length === 0 && messages.length > 0) {
      // Legacy data — wrap it in a session
      const legacySession: ChatSession = withSessionTreeFlags({
        id: generateId(),
        title: deriveTitle(messages),
        messages,
        currentTree,
        createdAt: messages[0]?.timestamp ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      hydratedSessions = [legacySession];
      activeSessionId = legacySession.id;
    } else if (sessions.length > 0) {
      hydratedSessions = sessions.map(withSessionTreeFlags);
      const latest = hydratedSessions[0];
      activeSessionId = latest.id;
      dispatch({
        type: "HYDRATE",
        state: {
          messages: latest.messages,
          currentTree: normalizeStoredTree(latest.currentTree),
          entries,
          sessions: hydratedSessions,
          activeSessionId,
          shardBalance,
        },
      });
      return;
    }

    dispatch({
      type: "HYDRATE",
      state: {
        messages,
        entries,
        currentTree,
        sessions: hydratedSessions,
        activeSessionId,
        shardBalance,
      },
    });
  }, []);

  // Persist sessions on change
  useEffect(() => {
    storageSet("sessions", state.sessions);
  }, [state.sessions]);

  useEffect(() => {
    storageSet("journal", state.entries);
  }, [state.entries]);

  useEffect(() => {
    storageSet("shards", state.shardBalance);
  }, [state.shardBalance]);

  // ── Actions ──

  const setTab = useCallback((tab: ActiveTab) => {
    dispatch({ type: "SET_TAB", tab });
  }, []);

  const newChat = useCallback(() => {
    const session: ChatSession = {
      id: generateId(),
      title: "",
      messages: [],
      currentTree: null,
      treeCreationDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "NEW_CHAT", session });
  }, []);

  const startChatWithJournalSummary = useCallback(
    (summary: string) => {
      const prompt = `I'd like to talk about something from my journal today:\n\n${summary}`;
      journalChatSeedRef.current = prompt;
      newChat();
    },
    [newChat]
  );

  const loadSession = useCallback(
    (id: string) => {
      const session = state.sessions.find((s) => s.id === id);
      if (!session) return;
      dispatch({ type: "LOAD_SESSION", session });
    },
    [state.sessions]
  );

  const deleteSession = useCallback((id: string) => {
    dispatch({ type: "DELETE_SESSION", id });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // If no active session yet, create one silently
      let sessionId = state.activeSessionId;
      if (!sessionId) {
        const session: ChatSession = {
          id: generateId(),
          title: "",
          messages: [],
          currentTree: null,
          treeCreationDone: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "NEW_CHAT", session });
        sessionId = session.id;
      }

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      dispatch({ type: "CONSUME_SHARDS", amount: 2 });

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_MESSAGE", message: assistantMsg });
      dispatch({ type: "SET_STREAMING", value: true });

      const history = [...state.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat(
        history,
        (token) => dispatch({ type: "UPDATE_LAST_ASSISTANT", content: token }),
        () => {
          dispatch({ type: "CONSUME_SHARDS", amount: 2 });
          dispatch({ type: "SET_STREAMING", value: false });
          dispatch({ type: "SAVE_SESSION" });
        },
        (err) => {
          console.error("Stream error:", err);
          dispatch({
            type: "UPDATE_LAST_ASSISTANT",
            content: " [Connection interrupted — please try again]",
          });
          dispatch({ type: "SET_STREAMING", value: false });
          dispatch({ type: "SAVE_SESSION" });
        }
      );
    },
    [state.messages, state.activeSessionId]
  );

  // Send seeded message after NEW_CHAT leaves the thread empty (avoids stale sendMessage state).
  useEffect(() => {
    const seed = journalChatSeedRef.current;
    if (seed === null) return;
    if (state.activeTab !== "chat") return;
    if (state.messages.length !== 0) return;
    if (state.isStreaming) return;
    if (!state.activeSessionId) return;

    journalChatSeedRef.current = null;
    void sendMessage(seed);
  }, [
    state.activeTab,
    state.messages,
    state.isStreaming,
    state.activeSessionId,
    sendMessage,
  ]);

  const requestTree = useCallback(
    async (endIndexInclusive: number) => {
      dispatch({ type: "SET_TREE_LOADING", value: true });
      dispatch({ type: "SET_TREE_SIDEBAR", open: true });

      try {
        const slice = state.messages.slice(0, endIndexInclusive + 1);
        const history = slice.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const hasTree =
          state.currentTree != null && state.currentTree.nodes.length > 0;

        let tree: WhatIfTree;
        if (hasTree) {
          tree = await expandOutcomesTree(
            history,
            state.currentTree!,
            state.selectedBranch?.id ?? null
          );
        } else {
          tree = await createOutcomesTree(history);
          dispatch({ type: "MARK_TREE_INITIALIZED" });
        }

        dispatch({ type: "SET_TREE", tree });
        dispatch({ type: "CONSUME_SHARDS", amount: 2 });
        dispatch({ type: "SAVE_SESSION" });
      } catch (err) {
        console.error("Tree generation error:", err);
      } finally {
        dispatch({ type: "SET_TREE_LOADING", value: false });
      }
    },
    [state.messages, state.currentTree, state.selectedBranch]
  );

  const wasStreamingRef = useRef(false);
  const lastAutoTreeForAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.messages.length === 0) {
      lastAutoTreeForAssistantIdRef.current = null;
    }
  }, [state.messages.length]);

  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = state.isStreaming;

    if (!wasStreaming || state.isStreaming) return;
    if (state.activeTab !== "chat") return;
    if (state.isTreeLoading) return;

    const lastIdx = state.messages.length - 1;
    const last = state.messages[lastIdx];
    if (!last || last.role !== "assistant" || !last.content.trim()) return;
    if (!shouldShowOutcomesButton(state.messages, lastIdx, false)) return;
    if (last.id === lastAutoTreeForAssistantIdRef.current) return;

    lastAutoTreeForAssistantIdRef.current = last.id;
    void requestTree(lastIdx);
  }, [
    state.isStreaming,
    state.messages,
    state.activeTab,
    state.isTreeLoading,
    requestTree,
  ]);

  const openTreeSidebar = useCallback(() => {
    dispatch({ type: "SET_TREE_SIDEBAR", open: true });
  }, []);

  const closeTreeSidebar = useCallback(() => {
    dispatch({ type: "SET_TREE_SIDEBAR", open: false });
  }, []);

  const selectBranch = useCallback((branch: Branch | null) => {
    dispatch({ type: "SELECT_BRANCH", branch });
  }, []);

  const reflectOnBranch = useCallback((branch: Branch) => {
    dispatch({
      type: "SET_DRAFT",
      draft: {
        text: `Reflecting on: "${branch.title}"\n\n${branch.description}\n\nInsight: ${branch.insight}\n\n`,
        linkedBranch: { title: branch.title, description: branch.description },
      },
    });
    dispatch({ type: "SET_TAB", tab: "journal" });
  }, []);

  const saveEntry = useCallback(
    (
      text: string,
      mood: MoodKey,
      meta?: { analysis?: JournalEntryAnalysis; displayTitle?: string }
    ) => {
      const id = generateId();
      const entry: JournalEntry = {
        id,
        text,
        mood,
        createdAt: new Date().toISOString(),
        linkedBranch: state.draftEntry?.linkedBranch,
        displayTitle: meta?.displayTitle?.trim() || deriveDisplayTitle(text),
        analysis: meta?.analysis,
      };
      dispatch({ type: "ADD_ENTRY", entry });
      dispatch({ type: "SET_DRAFT", draft: null });
      return id;
    },
    [state.draftEntry]
  );

  const updateJournalEntry = useCallback((id: string, patch: Partial<JournalEntry>) => {
    dispatch({ type: "UPDATE_JOURNAL_ENTRY", id, patch });
  }, []);

  const consumeShards = useCallback((amount = 2) => {
    dispatch({ type: "CONSUME_SHARDS", amount });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    dispatch({ type: "DELETE_ENTRY", id });
  }, []);

  const clearDraft = useCallback(() => {
    dispatch({ type: "SET_DRAFT", draft: null });
  }, []);

  const setJournalDraft = useCallback((draft: Partial<JournalEntry> | null) => {
    dispatch({ type: "SET_DRAFT", draft });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
    storageSet("messages", []);
    storageSet("tree", null);
  }, []);

  const removeTreeNodesWithDescendants = useCallback((nodeId: string) => {
    dispatch({ type: "REMOVE_TREE_NODES", nodeId });
    dispatch({ type: "SAVE_SESSION" });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setTab,
        sendMessage,
        requestTree,
        selectBranch,
        reflectOnBranch,
        saveEntry,
        updateJournalEntry,
        consumeShards,
        deleteEntry,
        clearDraft,
        setJournalDraft,
        clearChat,
        newChat,
        loadSession,
        deleteSession,
        openTreeSidebar,
        closeTreeSidebar,
        startChatWithJournalSummary,
        removeTreeNodesWithDescendants,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
