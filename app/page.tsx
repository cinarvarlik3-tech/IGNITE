"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { MessageCircle, GitBranch, BookOpen, PanelLeft } from "lucide-react";
import ChatScreen from "@/components/chat/ChatScreen";
import WhatIfScreen from "@/components/whatif/WhatIfScreen";
import JournalScreen from "@/components/journal/JournalScreen";
import DashboardScreen from "@/components/dashboard/DashboardScreen";
import ChatsSidebar from "@/components/sidebar/ChatsSidebar";
import TreesSidebar from "@/components/sidebar/TreesSidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import type { ActiveTab } from "@/types";

const TABS: { key: ActiveTab; label: string; icon: typeof MessageCircle }[] = [
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "whatif", label: "What If", icon: GitBranch },
  { key: "journal", label: "Journal", icon: BookOpen },
];

// ─── Inner layout (needs sidebar context) ───────────

function AppBody() {
  const { state, setTab, closeTreeSidebar } = useApp();
  const { state: sidebarState, open: leftOpen, setOpen, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  // Track previous left sidebar open state to detect transitions
  const prevLeftOpenRef = useRef(leftOpen);

  // When tree sidebar opens → collapse left sidebar
  useEffect(() => {
    if (state.isTreeSidebarOpen) {
      setOpen(false);
    }
  }, [state.isTreeSidebarOpen, setOpen]);

  // When left sidebar opens → close tree sidebar
  useEffect(() => {
    const wasOpen = prevLeftOpenRef.current;
    prevLeftOpenRef.current = leftOpen;
    if (!wasOpen && leftOpen) {
      closeTreeSidebar();
    }
  }, [leftOpen, closeTreeSidebar]);

  return (
    <>
      <ChatsSidebar />

      <SidebarInset className="bg-bg overflow-hidden">
        <div className="flex h-screen flex-col">
          {/* ─── Top Nav ─── */}
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              {/* Reopen button — only visible when left sidebar is collapsed */}
              {isCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="mr-1 flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-teal-light hover:text-teal-dark"
                  title="Open sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            <nav className="flex gap-1">
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = state.activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all
                      ${
                        active
                          ? "bg-teal-light text-teal-dark"
                          : "text-text-muted hover:bg-gray-50 hover:text-text"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Spacer to keep nav centered */}
            <div className="w-7" />
          </header>

          {/* ─── Body: main content + tree sidebar side by side ─── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main content — shrinks as TreesSidebar expands */}
            <main
              aria-label="Main content"
              className="min-w-0 flex-1 overflow-hidden"
            >
              {state.activeTab === "chat" && <ChatScreen />}
              {state.activeTab === "whatif" && <WhatIfScreen />}
              {state.activeTab === "journal" && <JournalScreen />}
              {state.activeTab === "dashboard" && <DashboardScreen />}
            </main>

            {/* Always mounted — CSS transitions + visibility handle open/close */}
            <TreesSidebar />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

// ─── Page root ───────────────────────────────────────

export default function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppBody />
    </SidebarProvider>
  );
}
