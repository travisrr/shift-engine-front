"use client";

import Image from "next/image";
import Link from "next/link";

// Metric data for the three servers shown in the hero image
interface ServerMetric {
  id: string;
  name: string;
  position: { top: string; left: string };
  calloutPosition: { top: string; left: string };
  metrics: {
    label: string;
    value: string;
    status: "good" | "bad" | "warning";
  }[];
}

const serverMetrics: ServerMetric[] = [
  {
    id: "server-1",
    name: "Sarah M.",
    position: { top: "40%", left: "22%" },
    calloutPosition: { top: "6%", left: "6%" },
    metrics: [
      { label: "Sales/hr", value: "$127", status: "good" },
      { label: "Tip %", value: "21.5%", status: "good" },
      { label: "Avg Check", value: "$68", status: "good" },
    ],
  },
  {
    id: "server-2",
    name: "Jordan K.",
    position: { top: "48%", left: "52%" },
    calloutPosition: { top: "6%", left: "72%" },
    metrics: [
      { label: "Sales/hr", value: "$89", status: "warning" },
      { label: "Tip %", value: "12.3%", status: "bad" },
      { label: "Avg Check", value: "$42", status: "bad" },
    ],
  },
  {
    id: "server-3",
    name: "Alex R.",
    position: { top: "42%", left: "82%" },
    calloutPosition: { top: "78%", left: "28%" },
    metrics: [
      { label: "Sales/hr", value: "$142", status: "good" },
      { label: "Tip %", value: "18.2%", status: "good" },
      { label: "Avg Check", value: "$54", status: "warning" },
    ],
  },
];

function MetricBadge({
  metric,
}: {
  metric: { label: string; value: string; status: "good" | "bad" | "warning" };
}) {
  const statusColors = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const statusDots = {
    good: "bg-emerald-500",
    bad: "bg-rose-500",
    warning: "bg-amber-500",
  };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${statusColors[metric.status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDots[metric.status]}`} />
      <span className="text-[10px] uppercase tracking-wide opacity-70">
        {metric.label}
      </span>
      <span className="font-semibold">{metric.value}</span>
    </div>
  );
}

function ServerCallout({ server }: { server: ServerMetric }) {
  return (
    <>
      {/* Pulsing dot at server location */}
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          top: server.position.top,
          left: server.position.left,
        }}
      >
        <div className="relative">
          <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-white/70" />
        </div>
      </div>

      {/* Callout box at corner position */}
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{
          top: server.calloutPosition.top,
          left: server.calloutPosition.left,
        }}
      >
        <div className="rounded-xl border border-white/30 bg-white p-3 shadow-[0_10px_40px_rgba(0,0,0,0.25)] min-w-[140px]">
          <p className="mb-2 text-xs font-semibold text-shift-text-dark">
            {server.name}
          </p>
          <div className="flex flex-col gap-1">
            {server.metrics.map((m) => (
              <MetricBadge key={m.label} metric={m} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ConnectionLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[15] h-full w-full overflow-visible">
      {/* Line from Sarah M. dot to her callout box */}
      <line
        x1="22%"
        y1="40%"
        x2="6%"
        y2="6%"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="5 3"
        opacity="0.95"
      />
      {/* Line from Jordan K. dot to his callout box */}
      <line
        x1="52%"
        y1="48%"
        x2="72%"
        y2="6%"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="5 3"
        opacity="0.95"
      />
      {/* Line from Alex R. dot to her callout box */}
      <line
        x1="82%"
        y1="42%"
        x2="28%"
        y2="78%"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="5 3"
        opacity="0.95"
      />
    </svg>
  );
}

export default function PhotoRealHero() {
  return (
    <section className="relative overflow-hidden bg-[#f7f6f3]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:py-20">
        {/* Text Column */}
        <div className="order-2 lg:order-1">
          <p className="mb-4 inline-flex rounded-full border border-shift-border bg-white px-3 py-1 text-xs font-semibold tracking-wide text-shift-green uppercase">
            Restaurant Performance Intelligence
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-shift-text-dark sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            Stop guessing.
            <span className="mt-2 block text-shift-green">
              Put the right server in the right section.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-shift-text-light">
            Shift Engine turns raw POS data into clear, coachable actions for
            revenue, retention, and floor stability. No spreadsheets. No
            favoritism. Just indisputable math.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/work-with-us"
              className="rounded-xl bg-shift-green px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-shift-green-accent"
            >
              Book a walkthrough
            </Link>
            <span className="rounded-xl border border-shift-border bg-white px-4 py-3.5 text-sm text-shift-text-light">
              Dashboard in ~3 seconds from CSV
            </span>
          </div>
        </div>

        {/* Hero Image with Callouts */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
            {/* Main Hero Image - NYC Restaurant Dining Room */}
            <Image
              src="/hero-nyc-dining-iphone.webp"
              alt="Busy NYC restaurant dining room with three servers tracked by performance metrics"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
            />

            {/* Subtle gradient overlay for text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Server Metric Callouts */}
            <ConnectionLines />
            {serverMetrics.map((server) => (
              <ServerCallout key={server.id} server={server} />
            ))}

            {/* Corner label - OPTIMIZED: removed backdrop-blur-sm */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-1.5">
              <p className="text-xs font-medium text-white">
                Live floor metrics · NYC
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
