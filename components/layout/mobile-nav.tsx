"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { MOBILE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { setAssistantOpen } = useShell();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      {MOBILE_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground"
      >
        <Sparkles className="size-4" />
        Ask AI
      </button>
    </nav>
  );
}
