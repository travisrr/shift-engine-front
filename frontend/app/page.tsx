import Image from "next/image";
import Link from "next/link";

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
    <article className="rounded-2xl border border-shift-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight"
        >
          <Image
            src="/shift-engine-logo-bw-nobg.png"
            alt="Shift Engine logo mark"
            width={38}
            height={38}
            className="h-9 w-9 object-contain"
            priority
          />
          <span>Shift Engine</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-shift-border bg-white px-4 py-2 text-sm font-medium text-shift-text-dark transition hover:bg-neutral-50"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden pb-16 pt-8 sm:pt-14">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-shift-border bg-white px-3 py-1 text-xs font-semibold tracking-wide text-shift-green uppercase">
              Restaurant Performance Intelligence
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Stop guessing.
              <span className="block text-shift-green">
                Put the right server in the right section.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-shift-text-light">
              Shift Engine turns raw POS data into clear, coachable actions for
              revenue, retention, and floor stability. No spreadsheets. No
              favoritism. Just indisputable math.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/work-with-us"
                className="rounded-xl bg-shift-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-shift-green-accent"
              >
                Book a walkthrough
              </Link>
              <span className="rounded-xl border border-shift-border bg-white px-4 py-3 text-sm text-shift-text-light">
                Dashboard generated in about 3 seconds from raw CSV
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-shift-border bg-white p-5 shadow-[0_12px_50px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-shift-text-dark">
                Multi-Unit Performance Snapshot
              </p>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Live
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700 uppercase">
                  Top Earner Alert
                </p>
                <p className="mt-1 text-sm text-shift-text-dark">
                  Alex M. drives $112/hr with 22.4% tip average in high-volume
                  patio sections.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase">
                  Coaching Opportunity
                </p>
                <p className="mt-1 text-sm text-shift-text-dark">
                  Jordan K. is top 5% in speed but bottom 10% in tip %. Focus:
                  guest engagement.
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-700 uppercase">
                  Section Risk
                </p>
                <p className="mt-1 text-sm text-shift-text-dark">
                  Host stand backups linked to two servers averaging below 3.4
                  guests/hr.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-shift-border bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
            Why teams switch
          </p>
          <h2 className="mb-10 max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl">
            From floor chaos to confident coaching in one shift.
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-shift-border bg-[#fcfbf8] p-6">
              <p className="mb-2 text-sm font-semibold text-shift-green">
                1. Upload
              </p>
              <p className="text-sm text-shift-text-light">
                Drag Toast (or POS) exports directly into Shift Engine.
              </p>
            </div>
            <div className="rounded-2xl border border-shift-border bg-[#fcfbf8] p-6">
              <p className="mb-2 text-sm font-semibold text-shift-green">
                2. Diagnose
              </p>
              <p className="text-sm text-shift-text-light">
                Instantly surface blind spots across sales, tip %, check size,
                and guest flow.
              </p>
            </div>
            <div className="rounded-2xl border border-shift-border bg-[#fcfbf8] p-6">
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
      </section>

      <SectionBlock
        eyebrow="The Money"
        title="Revenue & floor optimization pain points, solved with clear math."
        items={revenueAndFloor}
      />

      <SectionBlock
        eyebrow="The Time"
        title="Reduce management overhead and replace generic meetings with targeted coaching."
        items={managementTime}
      />

      <SectionBlock
        eyebrow="The People"
        title="Build a merit-based culture that keeps top performers engaged."
        items={peopleCulture}
      />

      <SectionBlock
        eyebrow="The Macro"
        title="Give ownership visibility across every unit without being on-site."
        items={ownershipVisibility}
      />

      <section className="pb-20 pt-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-shift-border bg-white px-6 py-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.06)] sm:px-12">
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
