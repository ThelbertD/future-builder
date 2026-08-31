"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Mode = "login" | "signup";

const COPY: Record<Mode, { title: string; description: string; submit: string; alt: string; altHref: string; altLabel: string }> = {
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

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("thelbert@futurebuilder.ai");
  const [password, setPassword] = React.useState("demo-password");
  const [name, setName] = React.useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    // Supabase Auth replaces this once the backend phase lands.
    window.setTimeout(() => {
      setLoading(false);
      toast.success(mode === "login" ? "Signed in" : "Workspace created");
      router.push("/dashboard");
    }, 650);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-[13px] text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" onClick={() => toast("Single sign-on arrives with the auth phase.")}>
          <Github />
          Continue with GitHub
        </Button>
        <Button variant="outline" size="lg" onClick={() => toast("Single sign-on arrives with the auth phase.")}>
          <Mail />
          Continue with Google
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" ? (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="h-10"
              required
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {copy.submit}
        </Button>
      </form>

      <p className="text-[13px] text-muted-foreground">
        {copy.alt}{" "}
        <Link href={copy.altHref} className="text-primary hover:underline">
          {copy.altLabel}
        </Link>
      </p>

      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
        Demo build — any credentials take you into the workspace with the bundled dataset.
      </p>
    </div>
  );
}
