"use client";

import * as React from "react";
import { Play, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AIBadge, AIThinking } from "@/components/ai/ai-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SERVICES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MODELS: Record<string, string[]> = {
  openai: ["gpt-4.1", "gpt-4.1-mini", "o4-mini"],
  anthropic: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
};

const DEFAULT_SYSTEM_PROMPT = `You qualify inbound and discovered opportunities for a service business.

Score each opportunity from 0-100 on intent, budget fit, service match, company fit, and timing.
Explain the score in two sentences a human can verify against the source posting.
Never invent facts about the company. If a detail is missing, say so.
When drafting outreach, open on the specific problem named in the posting and close with two concrete time slots.`;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[12px] text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </Card>
  );
}

export function AISettingsForm() {
  const [provider, setProvider] = React.useState("openai");
  const [model, setModel] = React.useState(MODELS.openai[0]);
  const [temperature, setTemperature] = React.useState([0.3]);
  const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);
  const [services, setServices] = React.useState<string[]>([
    "GoHighLevel Automation",
    "CRM Automation",
    "AI Automation",
  ]);
  const [tone, setTone] = React.useState("direct");
  const [minQualifyScore, setMinQualifyScore] = React.useState("70");
  const [autoBook, setAutoBook] = React.useState(true);
  const [handoffOnPricing, setHandoffOnPricing] = React.useState(true);
  const [handoffAfterReplies, setHandoffAfterReplies] = React.useState("3");
  const [testInput, setTestInput] = React.useState(
    "We posted a GoHighLevel specialist role. What do you actually do and how fast can you start?",
  );
  const [testOutput, setTestOutput] = React.useState("");
  const [testing, setTesting] = React.useState(false);

  const toggleService = (service: string) =>
    setServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );

  const runTest = () => {
    setTesting(true);
    setTestOutput("");
    window.setTimeout(() => {
      setTestOutput(
        `We build the follow-up system behind roles like that one: ${services[0] ?? "workflow automation"}, calendar routing, and a dashboard your team reviews weekly.\n\nTypical build is two weeks, and we can start within ten days. Would Thursday 10:00 or Friday 14:00 suit for a 20-minute walkthrough?`,
      );
      setTesting(false);
    }, 900);
  };

  return (
    <div className="space-y-4">
      <Section title="Model" description="Which provider reasons over your leads and drafts your messages.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => {
                setProvider(value);
                setModel(MODELS[value][0]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS[provider].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="font-mono text-[12px] tabular-nums">{temperature[0].toFixed(1)}</span>
            </div>
            <Slider value={temperature} onValueChange={setTemperature} min={0} max={1} step={0.1} className="pt-3" />
            <p className="text-[11px] text-muted-foreground">Lower is more consistent. 0.3 suits qualification.</p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          API keys live in server-side environment variables and are never exposed to the browser. Configure them in{" "}
          <code className="font-mono text-[11px]">.env.local</code>.
        </div>
      </Section>

      <Section title="System prompt" description="The standing instruction applied to every AI action in this workspace.">
        <Textarea
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          className="min-h-[168px] font-mono text-[12px]"
        />
      </Section>

      <Section title="Business information" description="Context the assistant uses to position you accurately.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business-name">Business name</Label>
            <Input id="business-name" defaultValue="Future Builder" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target-customer">Target customers</Label>
            <Input
              id="target-customer"
              defaultValue="Agencies and service businesses with 10-200 staff"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Services offered</Label>
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                  services.includes(service)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Tone of voice</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct and specific</SelectItem>
              <SelectItem value="consultative">Consultative</SelectItem>
              <SelectItem value="warm">Warm and personable</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Rules" description="Where the assistant acts on its own, and where it stops.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="qualify-score">Qualify at score</Label>
            <Input
              id="qualify-score"
              type="number"
              min={0}
              max={100}
              value={minQualifyScore}
              onChange={(event) => setMinQualifyScore(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Leads below this score stay in New for manual review.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handoff-replies">Hand off after</Label>
            <Input
              id="handoff-replies"
              type="number"
              min={1}
              max={10}
              value={handoffAfterReplies}
              onChange={(event) => setHandoffAfterReplies(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Prospect replies before a human takes the thread.</p>
          </div>
        </div>

        <div className="divide-y divide-border rounded-md border border-border">
          <label className="flex items-center gap-3 p-3">
            <Switch checked={autoBook} onCheckedChange={setAutoBook} />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">Allow booking without approval</span>
              <span className="block text-[12px] text-muted-foreground">
                The assistant may offer slots from your connected calendar and confirm them.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-3 p-3">
            <Switch checked={handoffOnPricing} onCheckedChange={setHandoffOnPricing} />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">Hand off on pricing questions</span>
              <span className="block text-[12px] text-muted-foreground">
                Anything outside your published range is escalated instead of answered.
              </span>
            </span>
          </label>
        </div>
      </Section>

      <Section title="Test a response" description="Run the current configuration against a sample prospect message.">
        <Textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={runTest} loading={testing}>
            <Play />
            Run test
          </Button>
          <Badge variant="outline">
            {provider === "openai" ? "OpenAI" : "Claude"} · {model}
          </Badge>
        </div>

        {testing ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <AIThinking />
            Generating…
          </div>
        ) : null}

        {testOutput ? (
          <div className="rounded-md border border-primary/25 bg-primary/[0.06] p-3">
            <AIBadge label="Sample output" size="sm" />
            <p className="mt-1.5 text-[13px] leading-relaxed whitespace-pre-wrap">{testOutput}</p>
          </div>
        ) : null}
      </Section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Reset to defaults
        </Button>
        <Button size="sm" onClick={() => toast.success("AI settings saved")}>
          <Save />
          Save changes
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Sparkles className="size-3 text-primary" />
        Changes apply to new qualification runs and drafts. Existing threads keep the settings they started with.
      </p>
    </div>
  );
}
