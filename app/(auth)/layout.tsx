import Link from "next/link";

import { Wordmark } from "@/components/layout/logo";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" className="w-fit">
          <Wordmark />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-center px-12">
          <p className="text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
            {BRAND.subtitle}
          </p>
          <h2 className="mt-4 max-w-md text-3xl leading-tight font-semibold tracking-tight">
            Find your next client before they find someone else.
          </h2>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {BRAND.tagline} Discovery, qualification, outreach, conversations, and booking in one workspace.
          </p>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              ["1,284", "Opportunities found"],
              ["24.1%", "Reply rate"],
              ["21 days", "Avg. time to close"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xl font-semibold tabular-nums">{value}</dt>
                <dd className="mt-1 text-[12px] text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
