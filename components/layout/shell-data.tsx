"use client";

import * as React from "react";

import type { AppNotification, LeadWithRelations } from "@/types";

export interface ShellSearchItem {
  id: string;
  label: string;
  detail: string;
  href: string;
}

/**
 * Everything the application chrome needs, resolved once per request by the
 * dashboard layout and handed down. Keeps sidebar, topbar, command menu and
 * assistant free of any direct data-source import.
 */
export interface ShellData {
  user: { id: string; fullName: string; email: string; jobTitle?: string };
  workspace: { id: string; name: string; plan: string } | null;
  notifications: AppNotification[];
  unreadConversations: number;
  activeAgentTasks: number;
  search: {
    leads: ShellSearchItem[];
    companies: ShellSearchItem[];
    conversations: ShellSearchItem[];
  };
  hotLeads: LeadWithRelations[];
}

const ShellDataContext = React.createContext<ShellData | null>(null);

export function ShellDataProvider({ value, children }: { value: ShellData; children: React.ReactNode }) {
  return <ShellDataContext.Provider value={value}>{children}</ShellDataContext.Provider>;
}

export function useShellData(): ShellData {
  const context = React.useContext(ShellDataContext);
  if (!context) throw new Error("useShellData must be used inside <ShellDataProvider>");
  return context;
}
