"use client";

import * as React from "react";

import { AIAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { CommandMenu } from "@/components/layout/command-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ShellProvider, useShell } from "@/components/layout/shell-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <TooltipProvider delayDuration={250}>
        <ShellLayout>{children}</ShellLayout>
      </TooltipProvider>
    </ShellProvider>
  );
}

function ShellLayout({ children }: { children: React.ReactNode }) {
  const { mobileNavOpen, setMobileNavOpen } = useShell();

  return (
    <div className="min-h-svh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] border-r border-sidebar-border lg:block">
        <Sidebar />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[264px] gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-svh flex-col lg:pl-[228px]">
        <Topbar />
        <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      </div>

      <MobileNav />
      <CommandMenu />
      <AIAssistantPanel />
    </div>
  );
}
