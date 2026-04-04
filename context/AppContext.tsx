"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Message,
  WhatIfTree,
  Branch,
  JournalEntry,
  ActiveTab,
  MoodKey,
  ChatSession,
} from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { streamChat, generateTree } from "@/lib/openai";

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
  | { type: "CONSUME_SHARDS"; amount?: number };

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

    case "CLEAR_CHAT":
      return { ...state, messages: [], currentTree: null, selectedBranch: null, isTreeSidebarOpen: false };

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
      return {
        ...state,
        sessions: updatedSessions,
        activeSessionId: action.session.id,
        messages: action.session.messages,
        currentTree: action.session.currentTree,
        selectedBranch: null,
        activeTab: "chat",
        isTreeSidebarOpen: false,
      };
    }

    case "SAVE_SESSION": {
      if (!state.activeSessionId || state.messages.length === 0) return state;
      const now = new Date().toISOString();
      const updatedSessions = state.sessions.map((s) => {
        if (s.id !== state.activeSessionId) return s;
        const title = s.title || deriveTitle(state.messages);
        return { ...s, title, messages: state.messages, currentTree: state.currentTree, updatedAt: now };
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

function persistCurrentSession(state: State): ChatSession[] {
  if (!state.activeSessionId || state.messages.length === 0) return state.sessions;
  const now = new Date().toISOString();
  const exists = state.sessions.some((s) => s.id === state.activeSessionId);
  if (!exists) return state.sessions;
  return state.sessions.map((s) => {
    if (s.id !== state.activeSessionId) return s;
    const title = s.title || deriveTitle(state.messages);
    return { ...s, title, messages: state.messages, currentTree: state.currentTree, updatedAt: now };
  });
}

// ─── Context ────────────────────────────────────────

interface AppContextValue {
  state: State;
  setTab: (tab: ActiveTab) => void;
  sendMessage: (content: string) => Promise<void>;
  requestTree: () => Promise<void>;
  selectBranch: (branch: Branch | null) => void;
  reflectOnBranch: (branch: Branch) => void;
  saveEntry: (text: string, mood: MoodKey) => void;
  deleteEntry: (id: string) => void;
  clearDraft: () => void;
  clearChat: () => void;
  newChat: () => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  openTreeSidebar: () => void;
  closeTreeSidebar: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ───────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const messages = storageGet<Message[]>("messages", []);
    const entries = storageGet<JournalEntry[]>("journal", []);
    const currentTree = storageGet<WhatIfTree | null>("tree", null);
    const sessions = storageGet<ChatSession[]>("sessions", []);
    const shardBalance = storageGet("shards", 1500);

    // Migrate legacy single-session messages into a session if needed
    let hydratedSessions = sessions;
    let activeSessionId: string | null = null;

    if (sessions.length === 0 && messages.length > 0) {
      // Legacy data — wrap it in a session
      const legacySession: ChatSession = {
        id: generateId(),
        title: deriveTitle(messages),
        messages,
        currentTree,
        createdAt: messages[0]?.timestamp ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      hydratedSessions = [legacySession];
      activeSessionId = legacySession.id;
    } else if (sessions.length > 0) {
      activeSessionId = sessions[0].id;
      const latest = sessions[0];
      dispatch({
        type: "HYDRATE",
        state: {
          messages: latest.messages,
          currentTree: latest.currentTree,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "NEW_CHAT", session });
  }, []);

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

  const requestTree = useCallback(async () => {
    dispatch({ type: "SET_TREE_LOADING", value: true });
    dispatch({ type: "SET_TREE_SIDEBAR", open: true }); // Open sidebar immediately (loading state visible)

    try {
      const history = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const tree = await generateTree(history);
      dispatch({ type: "SET_TREE", tree });
      dispatch({ type: "CONSUME_SHARDS", amount: 2 });
      dispatch({ type: "SAVE_SESSION" });
    } catch (err) {
      console.error("Tree generation error:", err);
    } finally {
      dispatch({ type: "SET_TREE_LOADING", value: false });
    }
  }, [state.messages]);

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
    (text: string, mood: MoodKey) => {
      const entry: JournalEntry = {
        id: generateId(),
        text,
        mood,
        createdAt: new Date().toISOString(),
        linkedBranch: state.draftEntry?.linkedBranch,
      };
      dispatch({ type: "ADD_ENTRY", entry });
      dispatch({ type: "SET_DRAFT", draft: null });
    },
    [state.draftEntry]
  );

  const deleteEntry = useCallback((id: string) => {
    dispatch({ type: "DELETE_ENTRY", id });
  }, []);

  const clearDraft = useCallback(() => {
    dispatch({ type: "SET_DRAFT", draft: null });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
    storageSet("messages", []);
    storageSet("tree", null);
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
        deleteEntry,
        clearDraft,
        clearChat,
        newChat,
        loadSession,
        deleteSession,
        openTreeSidebar,
        closeTreeSidebar,
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
