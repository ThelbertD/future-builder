"use client";

import * as React from "react";
import Link from "next/link";
import { Github, Mail, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  { title: string; description: string; submit: string; alt: string; altHref: string; altLabel: string }
> = {
  login: {
    title: "Sign in",
    description: "Welcome back. Pick up where your pipeline left off.",
    submit: "Sign in",
    alt: "New to Future Builder?",
    altHref: "/signup",
    altLabel: "Create an account",
  },
  signup: {
    title: "Create your workspace",
    description: "Start finding companies that are already hiring for what you do.",
    submit: "Create workspace",
    alt: "Already have an account?",
    altHref: "/login",
    altLabel: "Sign in",
  },
};

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(action, {});

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-[13px] text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" onClick={() => toast("Single sign-on arrives with the OAuth phase.")}>
          <Github />
          Continue with GitHub
        </Button>
        <Button variant="outline" size="lg" onClick={() => toast("Single sign-on arrives with the OAuth phase.")}>
          <Mail />
          Continue with Google
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="space-y-3">
        {mode === "signup" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" placeholder="Your name" className="h-10" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                name="workspaceName"
                placeholder="Your company"
                className="h-10"
              />
            </div>
          </>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" ? (
              <button type="button" className="text-[12px] text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
            ) : null}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            className="h-10"
            required
          />
          {mode === "signup" ? (
            <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
          ) : null}
        </div>

        {state?.error ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive"
          >
            <TriangleAlert className="mt-0.5 size-3 shrink-0" />
            {state.error}
          </p>
        ) : null}

        {state?.notice ? (
          <p className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-2 text-[12px] text-primary">
            {state.notice}
          </p>
        ) : null}

        <SubmitButton label={copy.submit} pending={pending} />
      </form>

      <p className="text-[13px] text-muted-foreground">
        {copy.alt}{" "}
        <Link href={copy.altHref} className="text-primary hover:underline">
          {copy.altLabel}
        </Link>
      </p>

      {!isSupabaseConfigured ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          Demo mode — Supabase is not configured, so any details take you straight into the workspace with the
          bundled dataset.
        </p>
      ) : null}
    </div>
  );
}
