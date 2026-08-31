"use client";

import * as React from "react";

const subscribe = () => () => {};

/**
 * False during server rendering and the first client render, true afterwards.
 * Guards browser-only UI (theme, platform) against hydration mismatches.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
