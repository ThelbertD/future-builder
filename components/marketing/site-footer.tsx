import Link from "next/link";

import { Wordmark } from "@/components/layout/logo";
import { BRAND } from "@/lib/constants";

const GROUPS = [
  {
    label: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Lead Finder", href: "/finder" },
      { label: "Pipeline", href: "/pipeline" },
      { label: "Analytics", href: "/analytics" },
    ],
  },
  {
    label: "Workspace",
    links: [
      { label: "Conversations", href: "/conversations" },
      { label: "Outreach", href: "/outreach" },
      { label: "Appointments", href: "/appointments" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create workspace", href: "/signup" },
      { label: "AI settings", href: "/ai-settings" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{BRAND.tagline}</p>
        </div>

        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[12px] font-medium">{group.label}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}. {BRAND.subtitle}.
        </p>
        <p className="text-[12px] text-muted-foreground">Built for service businesses that sell on speed.</p>
      </div>
    </footer>
  );
}
