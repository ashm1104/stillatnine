import { headers } from "next/headers";
import { getPricing } from "@/lib/pricing";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { WhatYoullRead } from "@/components/WhatYoullRead";
import { StoriesSection } from "@/components/StoriesSection";
import { HowItWorks } from "@/components/HowItWorks";
import { WhatThisIsNot } from "@/components/WhatThisIsNot";
import { EveryStoryIsReal } from "@/components/EveryStoryIsReal";
import { FinalCTA } from "@/components/FinalCTA";
import { WhosBehind } from "@/components/WhosBehind";
import { Footer } from "@/components/Footer";

// Locked config (HANDOFF §6): cinematic / alternating / archive / rich.
// Section tone: alternating -> dark when index is even.
const isDark = (idx: number) => idx % 2 === 0;

export default async function LandingPage() {
  // Geo-pricing from Vercel's edge header. India -> ₹499, otherwise -> $19.
  const country = (await headers()).get("x-vercel-ip-country");
  const pricing = getPricing(country);

  return (
    <div className="lp">
      <Navbar />
      <HeroSection pricing={pricing} />
      <WhatYoullRead dark={isDark(1)} />
      <StoriesSection dark={isDark(2)} />
      <HowItWorks dark={isDark(3)} />
      <WhatThisIsNot dark={isDark(4)} />
      <EveryStoryIsReal dark={isDark(5)} />
      <FinalCTA dark={isDark(6)} pricing={pricing} />
      <WhosBehind dark={isDark(7)} />
      <Footer />
    </div>
  );
}
