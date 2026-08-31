"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarPlus,
  KanbanSquare,
  MessagesSquare,
  Radar,
  Settings,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useShellData } from "@/components/layout/shell-data";

const ACTIONS = [
  { label: "Run a lead search", href: "/finder", icon: Radar, shortcut: "L" },
  { label: "Open pipeline", href: "/pipeline", icon: KanbanSquare, shortcut: "P" },
  { label: "Open conversations", href: "/conversations", icon: MessagesSquare, shortcut: "I" },
  { label: "Create lead", href: "/leads", icon: UserPlus },
  { label: "Create appointment", href: "/appointments", icon: CalendarPlus },
  { label: "Open analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandMenu() {
  const router = useRouter();
  const { commandOpen, setCommandOpen, setAssistantOpen } = useShell();
  const { search } = useShellData();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, setCommandOpen]);

  const go = React.useCallback(
    (href: string) => {
      setCommandOpen(false);
      router.push(href);
    },
    [router, setCommandOpen],
  );

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search leads, companies, conversations or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="ask ai assistant"
            onSelect={() => {
              setCommandOpen(false);
              setAssistantOpen(true);
            }}
          >
            <Sparkles />
            Ask AI
            <CommandShortcut>⇧ A</CommandShortcut>
          </CommandItem>
          {ACTIONS.map((action) => (
            <CommandItem key={action.href + action.label} value={action.label} onSelect={() => go(action.href)}>
              <action.icon />
              {action.label}
              {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Leads">
          {search.leads.map((item) => (
            <CommandItem key={item.id} value={`${item.label} ${item.detail}`} onSelect={() => go(item.href)}>
              <UserPlus />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto truncate pl-3 text-[11px] text-muted-foreground">{item.detail}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Companies">
          {search.companies.map((item) => (
            <CommandItem key={item.id} value={`${item.label} ${item.detail}`} onSelect={() => go(item.href)}>
              <Building2 />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto truncate pl-3 text-[11px] text-muted-foreground">{item.detail}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Conversations">
          {search.conversations.map((item) => (
            <CommandItem key={item.id} value={item.label} onSelect={() => go(item.href)}>
              <MessagesSquare />
              <span className="truncate">{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
