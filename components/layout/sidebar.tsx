"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";

import { AIStatusDot } from "@/components/ai/ai-badge";
import { Wordmark } from "@/components/layout/logo";
import { useShell } from "@/components/layout/shell-context";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_GROUPS } from "@/lib/constants";
import { CURRENT_WORKSPACE, UNREAD_CONVERSATION_COUNT } from "@/lib/mock";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, match?: string) {
  if (pathname === href) return true;
  if (match) return pathname.startsWith(`${match}/`) || pathname === match;
  return false;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-[52px] shrink-0 items-center border-b border-sidebar-border px-3">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-2 pb-1.5 text-[10px] font-medium tracking-wider text-muted-foreground/80 uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, item.match);
                const Icon = item.icon;
                const unread = item.href === "/conversations" ? UNREAD_CONVERSATION_COUNT : 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge === "live" ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                          <AIStatusDot />
                        </span>
                      ) : null}
                      {unread > 0 ? (
                        <Badge variant="primary" className="ml-auto tabular-nums">
                          {unread}
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <AgentStatus />
    </div>
  );
}

function WorkspaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-sidebar-accent/60">
        <Wordmark />
        <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuItem className="justify-between">
          {CURRENT_WORKSPACE.name}
          <Badge variant="primary" className="capitalize">
            {CURRENT_WORKSPACE.plan}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AgentStatus() {
  const { setAssistantOpen } = useShell();

  return (
    <div className="border-t border-sidebar-border p-2">
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60"
      >
        <span className="flex size-6 items-center justify-center rounded-md border border-border bg-card">
          <AIStatusDot />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium">AI Agent</span>
          <span className="block text-[11px] text-success">Online · 3 tasks running</span>
        </span>
      </button>
    </div>
  );
}
