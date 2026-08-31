import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  KanbanSquare,
  MessagesSquare,
  Radar,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("border-b border-border", className)}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-[38px]">{title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Radar,
    title: "Find",
    body: "Continuous searches surface companies that just posted work matching what you sell, across LinkedIn, job boards, marketplaces and communities.",
  },
  {
    icon: Sparkles,
    title: "Qualify",
    body: "Every opportunity is scored on intent, budget fit, service match, company fit and timing, with the reasoning written out so you can check it.",
  },
  {
    icon: MessagesSquare,
    title: "Engage",
    body: "Outreach opens on the specific problem named in their posting. Replies land in a shared inbox where the assistant drafts and you approve.",
  },
  {
    icon: CalendarCheck,
    title: "Book",
    body: "When intent is clear, the assistant offers real slots from your calendar and confirms the call without a back-and-forth thread.",
  },
  {
    icon: Trophy,
    title: "Convert",
    body: "Your pipeline shows exactly where every deal stands, what has gone quiet, and which source is actually producing clients.",
  },
];

export function HowItWorks() {
  return (
    <SectionShell
      id="how-it-works"
      eyebrow="How it works"
      title="From cold market to booked call, in one system."
      description="Five steps that normally live in five tools. Here they share the same records, so nothing is retyped and nothing is lost."
    >
      <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 bg-background p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <step.icon className="size-3.5" />
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">0{index + 1}</span>
            </div>
            <h3 className="text-[15px] font-semibold tracking-tight">{step.title}</h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

const FEATURES = [
  {
    icon: Radar,
    title: "AI lead discovery",
    body: "Saved searches run on a schedule and only surface what is new since the last run. No duplicate work, no stale listings.",
  },
  {
    icon: Sparkles,
    title: "Smart qualification",
    body: "A transparent 0-100 score with signals and risks attached, so you can defend the decision to work a lead or drop it.",
  },
  {
    icon: MessagesSquare,
    title: "AI conversations",
    body: "The assistant replies in your voice and hands the thread over the moment a prospect asks something outside your rules.",
  },
  {
    icon: KanbanSquare,
    title: "Custom pipeline",
    body: "Stages, colours and probabilities are yours to define. Drag a card and the forecast updates immediately.",
  },
  {
    icon: CalendarCheck,
    title: "Appointment booking",
    body: "Two-way calendar sync, reminder sequences, and no-show recovery so booked calls actually happen.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Source performance, funnel conversion, and AI contribution, measured against the outcomes you care about.",
  },
];

export function Features() {
  return (
    <SectionShell
      id="features"
      eyebrow="Features"
      title="Built for the way service businesses actually sell."
      description="Dense where you need detail, quiet everywhere else. The product gets out of the way once you know what to do next."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="bg-background p-5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted">
              <feature.icon className="size-4 text-primary" />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{feature.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "We stopped guessing which agencies to approach. The scoring is specific enough that I trust it, and the reasoning tells me how to open the conversation.",
    name: "Marisol Vega",
    role: "Head of Delivery, Northbeam Marketing",
  },
  {
    quote:
      "Our first response used to take four hours. It now takes three minutes, and the assistant books the call before I have opened my laptop.",
    name: "Grant Halloway",
    role: "General Manager, Vantage Roofing",
  },
  {
    quote:
      "The pipeline is the first CRM my team has not abandoned. Everything they need is on the card, so nothing gets retyped.",
    name: "Harriet Nakamura",
    role: "Managing Director, Kestrel Digital Studio",
  },
];

export function Testimonials() {
  return (
    <SectionShell
      eyebrow="Testimonials"
      title="Teams that fill their own pipeline."
      description="Agencies, contractors and consultancies using Future Builder to find work that is already funded."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <figure key={testimonial.name} className="rounded-xl border border-border bg-card p-5">
            <blockquote className="text-[14px] leading-relaxed">“{testimonial.quote}”</blockquote>
            <figcaption className="mt-4 border-t border-border pt-3">
              <p className="text-[13px] font-medium">{testimonial.name}</p>
              <p className="text-[12px] text-muted-foreground">{testimonial.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}

const PLANS = [
  {
    name: "Starter",
    price: "$79",
    description: "For solo operators who want a steady flow of qualified opportunities.",
    features: ["500 leads per month", "2 saved searches", "AI qualification", "Pipeline and inbox", "1 seat"],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "$199",
    description: "For small teams running outreach and booking calls every week.",
    features: [
      "2,500 leads per month",
      "Unlimited saved searches",
      "AI conversations and drafting",
      "Outreach campaigns",
      "Calendar booking",
      "5 seats",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Scale",
    price: "$449",
    description: "For agencies running acquisition for themselves and their clients.",
    features: [
      "10,000 leads per month",
      "Multiple workspaces",
      "Custom qualification rules",
      "API and webhooks",
      "Priority support",
      "Unlimited seats",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

export function Pricing() {
  return (
    <SectionShell
      id="pricing"
      eyebrow="Pricing"
      title="Priced against the pipeline it produces."
      description="One booked client usually covers the year. Every plan includes discovery, qualification and the full workspace."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col rounded-xl border p-5",
              plan.featured ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card",
            )}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight">{plan.name}</h3>
              {plan.featured ? <Badge variant="primary">Most popular</Badge> : null}
            </div>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-[13px] text-muted-foreground">/ month</span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{plan.description}</p>

            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button asChild className="mt-6 w-full" variant={plan.featured ? "default" : "outline"}>
              <Link href="/signup">{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

const FAQS = [
  {
    question: "Where do the leads come from?",
    answer:
      "Public hiring signals: job boards, professional networks, freelance marketplaces, community posts and company career pages. Every lead links back to the original source so you can verify it yourself.",
  },
  {
    question: "Is this just another CRM?",
    answer:
      "The pipeline is one part of it. The difference is that opportunities arrive already discovered, scored and explained, so the CRM starts full rather than empty.",
  },
  {
    question: "Will the AI email people without me?",
    answer:
      "Only if you turn that on. By default the assistant drafts and you approve. Rules decide when it books a call on its own and when it hands a thread back to you.",
  },
  {
    question: "Can I use my own domain and inbox?",
    answer:
      "Yes. Connect your email provider and outreach sends from your address with replies threaded back into the shared inbox.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Every record is scoped to your workspace and protected by row level security. Provider keys stay server-side and are never exposed to the browser.",
  },
  {
    question: "Do you support teams?",
    answer:
      "Workspaces have owner, admin, member and viewer roles. Leads, conversations and appointments can be assigned, and analytics break down by owner.",
  },
];

export function FAQ() {
  return (
    <SectionShell
      id="faq"
      eyebrow="FAQ"
      title="Questions worth asking before you switch."
      description="If something is not covered here, the answer is one message away."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group bg-background p-5">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-[14px] font-medium marker:content-['']">
              {faq.question}
              <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 80% at 50% 100%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-center">
        <Target className="mx-auto size-5 text-primary" />
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-[40px]">
          Build your pipeline before your competitors do.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Start with the companies already hiring for what you sell. The first qualified list takes about four minutes.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">
              Start finding clients
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">
              <Send />
              Explore the workspace
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
