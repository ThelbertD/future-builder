import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { FAQ, Features, FinalCTA, HowItWorks, Pricing, Testimonials } from "@/components/marketing/sections";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${BRAND.product} — ${BRAND.subtitle}`,
  description: BRAND.tagline,
};

export default function LandingPage() {
  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
