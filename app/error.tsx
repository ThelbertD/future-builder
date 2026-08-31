"use client";

import * as React from "react";

import { ErrorState } from "@/components/common/error-state";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // Replace with your error reporting sink.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <ErrorState
        title="Unable to load this view"
        description="Something went wrong on our side. Nothing in your workspace was changed."
        onRetry={reset}
        className="w-full max-w-md"
      />
    </div>
  );
}
