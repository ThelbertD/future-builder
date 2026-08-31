"use client";

import * as React from "react";

const subscribe = () => () => {};

function readModifier(): string {
  const agent = window.navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(agent) ? "⌘" : "Ctrl";
}

/** Returns "⌘" on Apple platforms and "Ctrl" everywhere else. */
export function useModifierKey(): string {
  return React.useSyncExternalStore(subscribe, readModifier, () => "Ctrl");
}
