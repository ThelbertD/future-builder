"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarPlus,
  CircleHelp,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";

import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { useShell } from "@/components/layout/shell-context";
import { Wordmark } from "@/components/layout/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useModifierKey } from "@/hooks/use-platform";
import { useMounted } from "@/hooks/use-mounted";
import { CURRENT_USER } from "@/lib/mock";
import { initials } from "@/lib/utils";

export function Topbar() {
  const { setMobileNavOpen, setCommandOpen } = useShell();
  const modifier = useModifierKey();

  return (
    <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md lg:px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      <Link href="/dashboard" className="lg:hidden">
        <Wordmark compact />
      </Link>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-8 w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="size-3.5" />
        <span>Search leads, companies, conversations…</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] tracking-wider">
          {modifier} K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon-sm"
        className="sm:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Search"
      >
        <Search />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <QuickCreate />
        <NotificationsMenu />
        <HelpMenu />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function QuickCreate() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Quick create</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push("/finder")}>
          <UserPlus />
          New lead search
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/companies")}>
          <Building2 />
          Add company
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/appointments")}>
          <CalendarPlus />
          Book appointment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/outreach")}>
          <Plus />
          New campaign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <CircleHelp />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>
          <LifeBuoy />
          Documentation
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CircleHelp />
          Keyboard shortcuts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted && !isDark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{mounted && isDark ? "Switch to light" : "Switch to dark"}</TooltipContent>
    </Tooltip>
  );
}

function UserMenu() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-1 rounded-full outline-none">
        <Avatar>
          <AvatarFallback>{initials(CURRENT_USER.fullName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-[13px] font-medium">{CURRENT_USER.fullName}</p>
          <p className="text-[12px] text-muted-foreground">{CURRENT_USER.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings />
          Settings
          <DropdownMenuShortcut>⇧ S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <UserPlus />
          Invite teammates
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => router.push("/login")}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
