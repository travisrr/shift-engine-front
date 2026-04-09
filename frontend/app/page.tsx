import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/landing/Navbar";
import PhotoRealHero from "./components/landing/PhotoRealHero";
import PhotoSection, { PhotoAccent } from "./components/landing/PhotoSection";
import WhispyBackground from "./components/landing/WhispyBackground";
import PointillismBackground from "./components/landing/PointillismBackground";
import Pricing from "./components/landing/Pricing";

type PainPoint = {
  pain: string;
  solution: string;
};

const revenueAndFloor: PainPoint[] = [
  {
    pain: "Blind Scheduling: Prime sections are assigned by gut feel, tenure, or who complains the loudest.",
    solution:
      "Shift Engine surfaces top earners so managers can confidently assign their strongest closers to high-volume sections.",
  },
  {
    pain: 'The "Burn & Turn" Illusion: Fast servers ring high sales but crater Tip % by rushing guests.',
    solution:
      "By cross-referencing Sales/hr and Tip %, Shift Engine flags speed-at-all-cost behavior before reviews and retention suffer.",
  },
  {
    pain: "Order-Takers vs. Salespeople: Some servers only write down orders instead of lifting ticket size.",
    solution:
      'Average Check performance makes this visible immediately so managers know who needs coaching on upsells and menu fluency.',
  },
  {
    pain: 'Table Bottlenecks: Some servers constantly get "in the weeds," spiking ticket times and slowing turns.',
    solution:
      "Guests/hr benchmarks reveal who can handle larger sections and who should be capped while they improve pace.",
  },
];

const managementTime: PainPoint[] = [
  {
    pain: "Spreadsheet Hell: POS exports are huge and unreadable, and managers cannot spend hours in pivot tables.",
    solution:
      "A drag-and-drop workflow cleans raw data, runs the math, and generates a visual dashboard in seconds.",
  },
  {
    pain: "Generic Pre-Shift Meetings: Coaching is vague because managers lack role-specific, current data.",
    solution:
      'Shift Engine creates 1-minute coaching prompts like: "Your speed is top-tier, your Average Check is bottom 10%. Focus on wine suggestions tonight."',
  },
  {
    pain: 'The "Favoritism" Trap: Cuts and shift assignments can trigger team drama and fairness accusations.',
    solution:
      'Performance conversations move from opinions to objective scorecards: "Here is your Final Score from raw service data."',
  },
];

const peopleCulture: PainPoint[] = [
  {
    pain: "Top-Performer Churn: Elite servers leave when value is not clearly recognized or rewarded.",
    solution:
      "Objective scorecards justify premium shifts for A-players and make retention decisions obvious.",
  },
  {
    pain: "The Tenure Problem: Long-tenured staff can claim premium shifts while high-performing new hires are sidelined.",
    solution:
      "Shift Engine enforces merit-based scheduling where shifts and sections are earned through measurable results.",
  },
  {
    pain: "Vague Training and Probation: New hires are signed off with inconsistent standards.",
    solution:
      'Managers can define graduation benchmarks (for example: 19% tip average and $50 average check over five shifts).',
  },
];

const ownershipVisibility: PainPoint[] = [
  {
    pain: "Disconnected Ownership: Regional leaders often cannot see where the true talent is across locations.",
    solution:
      "A centralized dashboard ranks top performers across the group so ownership can identify and develop future leaders quickly.",
  },
];

function PainSolutionCard({ pain, solution }: PainPoint) {
  return (
    <article className="rounded-2xl border border-shift-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <p className="mb-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-rose-700 uppercase">
        Pain Point
      </p>
      <p className="mb-5 text-[15px] text-shift-text-dark">{pain}</p>

      <p className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
        The Solution
      </p>
      <p className="text-[15px] text-shift-text-light">{solution}</p>
    </article>
  );
}

function SectionBlock({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: PainPoint[];
}) {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
          {eyebrow}
        </p>
        <h2 className="mb-8 max-w-3xl text-2xl font-semibold tracking-tight text-shift-text-dark sm:text-4xl">
          {title}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <PainSolutionCard
              key={`${item.pain.slice(0, 24)}-${item.solution.slice(0, 24)}`}
              pain={item.pain}
              solution={item.solution}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#f7f6f3] text-shift-text-dark">
      {/* Navbar */}
      <Navbar />

      {/* Hero with Digital Pointillism background - tech sophistication */}
      <div className="relative overflow-hidden">
        <PointillismBackground
          particleCount={80}  // REDUCED from 320 for performance
          connectionDistance={100}
          maxConnections={2}
          className="opacity-70"
        />
        <PhotoRealHero />
      </div>

      {/* How it Works - with dining photo background */}
      <div className="relative">
        <WhispyBackground intensity="low" className="opacity-40" />
        <PhotoSection
          imageSrc="/lunch-dining-photo-01.webp"
          imageAlt="Busy restaurant lunch service"
          overlayOpacity={85}
          overlayColor="light"
          minHeight="auto"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
              Why teams switch
            </p>
            <h2 className="mb-10 max-w-3xl text-2xl font-semibold tracking-tight text-shift-text-dark sm:text-4xl">
              From floor chaos to confident coaching in one shift.
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-shift-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <p className="mb-2 text-sm font-semibold text-shift-green">
                  1. Upload
                </p>
                <p className="text-sm text-shift-text-light">
                  Drag Toast (or POS) exports directly into Shift Engine.
                </p>
              </div>
              <div className="rounded-2xl border border-shift-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <p className="mb-2 text-sm font-semibold text-shift-green">
                  2. Diagnose
                </p>
                <p className="text-sm text-shift-text-light">
                  Instantly surface blind spots across sales, tip %, check size,
                  and guest flow.
                </p>
              </div>
              <div className="rounded-2xl border border-shift-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <p className="mb-2 text-sm font-semibold text-shift-green">
                  3. Act
                </p>
                <p className="text-sm text-shift-text-light">
                  Run objective coaching, optimize sections, and reward the true
                  top performers.
                </p>
              </div>
            </div>
          </div>
        </PhotoSection>
      </div>

      {/* Revenue Section with photo accent */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <PhotoAccent
                imageSrc="/lunch-dining-photo-02.webp"
                imageAlt="Servers during busy lunch rush"
                aspectRatio="portrait"
                className="max-w-md lg:max-w-none"
              />
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
                The Money
              </p>
              <h2 className="mb-8 text-2xl font-semibold tracking-tight text-shift-text-dark sm:text-3xl">
                Revenue & floor optimization pain points, solved with clear math.
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {revenueAndFloor.map((item) => (
                  <PainSolutionCard
                    key={item.pain.slice(0, 30)}
                    pain={item.pain}
                    solution={item.solution}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Management Time - full-bleed photo background */}
      <div className="relative">
        <WhispyBackground intensity="medium" className="opacity-50" />
        <PhotoSection
          imageSrc="/lunch-dining-photo-03.webp"
          imageAlt="Restaurant manager reviewing service"
          overlayOpacity={80}
          overlayColor="green"
          minHeight="500px"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-white/80 uppercase">
              The Time
            </p>
            <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Reduce management overhead and replace generic meetings with targeted coaching.
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {managementTime.map((item) => (
                <PainSolutionCard
                  key={item.pain.slice(0, 30)}
                  pain={item.pain}
                  solution={item.solution}
                />
              ))}
            </div>
          </div>
        </PhotoSection>
      </div>

      {/* People Culture - alternating layout */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="order-2 lg:order-1">
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
                The People
              </p>
              <h2 className="mb-8 text-2xl font-semibold tracking-tight text-shift-text-dark sm:text-3xl">
                Build a merit-based culture that keeps top performers engaged.
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {peopleCulture.map((item) => (
                  <PainSolutionCard
                    key={item.pain.slice(0, 30)}
                    pain={item.pain}
                    solution={item.solution}
                  />
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <PhotoAccent
                imageSrc="/lunch-dining-photo-04.webp"
                imageAlt="Restaurant team during service"
                aspectRatio="landscape"
                className="max-w-md lg:max-w-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ownership - photo background */}
      <PhotoSection
        imageSrc="/hero-nyc-dining-iphone.webp"
        imageAlt="Multi-unit restaurant operations"
        overlayOpacity={70}
        overlayColor="dark"
        minHeight="400px"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-white/80 uppercase">
            The Macro
          </p>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Give ownership visibility across every unit without being on-site.
          </h2>
          {/* OPTIMIZED: Removed backdrop-blur-sm which causes GPU compositing issues */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/20 bg-white/15 p-6">
            <p className="mb-3 inline-flex rounded-full bg-rose-50/90 px-3 py-1 text-xs font-semibold tracking-wide text-rose-700 uppercase">
              Pain Point
            </p>
            <p className="mb-5 text-[15px] text-white/90">
              {ownershipVisibility[0].pain}
            </p>
            <p className="mb-3 inline-flex rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              The Solution
            </p>
            <p className="text-[15px] text-white/80">
              {ownershipVisibility[0].solution}
            </p>
          </div>
        </div>
      </PhotoSection>

      {/* Pricing Section */}
      <Pricing />

      {/* Final CTA with Digital Pointillism - sophisticated closing */}
      <section className="relative overflow-hidden pb-20 pt-8">
        <div className="absolute inset-0">
          <PointillismBackground
            particleCount={50}  // REDUCED from 180 for performance
            connectionDistance={80}
            maxConnections={1}
            className="opacity-50"
          />
        </div>
        {/* OPTIMIZED: Removed backdrop-blur-sm which causes GPU compositing issues during scroll */}
        <div className="relative mx-auto max-w-6xl rounded-3xl border border-shift-border bg-white/98 px-6 py-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.06)] sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Shift Engine brings objective clarity to every shift.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-shift-text-light">
            Make staffing and coaching decisions based on performance data, not
            politics. Keep A-players loyal. Improve guest experience at scale.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/work-with-us"
              className="rounded-xl bg-shift-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-shift-green-accent"
            >
              See Shift Engine in action
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
