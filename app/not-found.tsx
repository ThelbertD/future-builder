import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-[12px] tracking-widest text-muted-foreground uppercase">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        The link may be outdated, or the record was removed from your workspace.
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/">Go to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
