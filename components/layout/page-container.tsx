import * as React from "react";

import { cn } from "@/lib/utils";

/** Standard page padding. Full-height views (pipeline, inbox) opt out. */
export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 lg:px-6", className)}>{children}</div>;
}
