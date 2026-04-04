"use client";

import React, { useState } from "react";
import {
  TreePine,
  MessageSquarePlus,
  Moon,
  Search,
  LayoutDashboard,
  Trash2,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import type { ChatSession } from "@/types";
import SearchChatsModal from "@/components/sidebar/SearchChatsModal";

// ─── Date grouping ───────────────────────────────────

function getGroup(iso: string): "Today" | "Yesterday" | "This Week" | "Older" {
  const now = new Date();
  const d = new Date(iso);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Older";
}

type GroupKey = "Today" | "Yesterday" | "This Week" | "Older";
const GROUP_ORDER: GroupKey[] = ["Today", "Yesterday", "This Week", "Older"];

function groupSessions(sessions: ChatSession[]) {
  const groups: Partial<Record<GroupKey, ChatSession[]>> = {};
  for (const s of sessions) {
    const g = getGroup(s.updatedAt);
    if (!groups[g]) groups[g] = [];
    groups[g]!.push(s);
  }
  return groups;
}

// ─── Component ───────────────────────────────────────

export default function ChatsSidebar() {
  const { state, newChat, loadSession, deleteSession, setTab } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);

  const savedSessions = state.sessions.filter((s) => s.messages.length > 0);
  const grouped = groupSessions(savedSessions);

  const navItems = [
    {
      label: "New Chat",
      icon: MessageSquarePlus,
      onClick: () => newChat(),
    },
    {
      label: "New Shadow Work",
      icon: Moon,
      onClick: () => {/* coming soon */},
    },
    {
      label: "Search Chats",
      icon: Search,
      onClick: () => setSearchOpen(true),
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => setTab("dashboard"),
    },
  ];

  return (
    <>
      <Sidebar collapsible="offcanvas">
        {/* ── Header ── */}
        <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-teal" />
              <span className="text-base font-semibold text-sidebar-foreground">WhatIf</span>
            </div>
            <SidebarTrigger className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* ── Nav actions ── */}
          <SidebarGroup className="pt-2 pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      tooltip={item.label}
                      className="gap-3 text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-teal" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-1" />

          {/* ── Chat list ── */}
          {savedSessions.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-sidebar-foreground/40">
              Your chats will appear here
            </div>
          ) : (
            GROUP_ORDER.map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <SidebarGroup key={group} className="py-0">
                  <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/50 uppercase tracking-wide">
                    {group}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((session) => {
                        const isActive = session.id === state.activeSessionId;
                        return (
                          <SidebarMenuItem key={session.id}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => loadSession(session.id)}
                              tooltip={session.title || "Untitled chat"}
                              className="pr-8 text-sidebar-foreground/80"
                            >
                              <span className="truncate text-sm">
                                {session.title || "Untitled chat"}
                              </span>
                            </SidebarMenuButton>
                            <SidebarMenuAction
                              showOnHover
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="text-sidebar-foreground/40 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </SidebarMenuAction>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                tooltip="Settings"
                onClick={() => {}}
                className="gap-3 font-medium text-sidebar-foreground/80"
              >
                <Settings className="h-4 w-4 shrink-0 text-teal" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SearchChatsModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
