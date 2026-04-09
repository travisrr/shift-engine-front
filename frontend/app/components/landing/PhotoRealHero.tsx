"use client";

import Image from "next/image";
import Link from "next/link";

// Metric data for the three servers shown in the hero image
interface ServerMetric {
  id: string;
  name: string;
  position: { top: string; left: string };
  metrics: {
    label: string;
    value: string;
    status: "good" | "bad" | "warning";
  }[];
  lineAngle: number;
  lineLength: number;
}

const serverMetrics: ServerMetric[] = [
  {
    id: "server-1",
    name: "Sarah M.",
    position: { top: "35%", left: "22%" },
    metrics: [
      { label: "Sales/hr", value: "$127", status: "good" },
      { label: "Tip %", value: "21.5%", status: "good" },
      { label: "Avg Check", value: "$68", status: "good" },
    ],
    lineAngle: -45,
    lineLength: 120,
  },
  {
    id: "server-2",
    name: "Jordan K.",
    position: { top: "42%", left: "58%" },
    metrics: [
      { label: "Sales/hr", value: "$89", status: "warning" },
      { label: "Tip %", value: "12.3%", status: "bad" },
      { label: "Avg Check", value: "$42", status: "bad" },
    ],
    lineAngle: 15,
    lineLength: 100,
  },
  {
    id: "server-3",
    name: "Alex R.",
    position: { top: "28%", left: "78%" },
    metrics: [
      { label: "Sales/hr", value: "$142", status: "good" },
      { label: "Tip %", value: "18.2%", status: "good" },
      { label: "Avg Check", value: "$54", status: "warning" },
    ],
    lineAngle: 60,
    lineLength: 90,
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
  // Calculate line endpoint based on angle and length
  const rad = (server.lineAngle * Math.PI) / 180;
  const lineEndX = Math.cos(rad) * server.lineLength;
  const lineEndY = Math.sin(rad) * server.lineLength;

  // Determine callout position based on angle
  const isRightSide = server.lineAngle > -90 && server.lineAngle < 90;
  const calloutSide = isRightSide ? "left" : "right";

  return (
    <div
      className="absolute"
      style={{
        top: server.position.top,
        left: server.position.left,
      }}
    >
      {/* Pulsing dot at server location */}
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <div className="h-3 w-3 rounded-full bg-white shadow-lg" />
        <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-white/60" />
      </div>

      {/* Dotted line to callout */}
      <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible"
        style={{
          width: Math.abs(lineEndX) + 40,
          height: Math.abs(lineEndY) + 80,
          transform: `translate(${calloutSide === "left" ? "10px" : "-10px"}, -10px)`,
        }}
      >
        <line
          x1={calloutSide === "left" ? 0 : Math.abs(lineEndX) + 20}
          y1={10}
          x2={calloutSide === "left" ? lineEndX + 20 : 20}
          y2={lineEndY + 10}
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.9"
        />
      </svg>

      {/* Callout box */}
      <div
        className={`absolute z-20 rounded-xl border border-white/30 bg-white/95 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm ${calloutSide === "left" ? "ml-4" : "-ml-4 -translate-x-full"}`}
        style={{
          transform: `translate(${lineEndX}px, ${lineEndY}px) ${calloutSide === "right" ? "translateX(-100%)" : ""}`,
          minWidth: "140px",
        }}
      >
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
              src="/hero-nyc-dining-iphone.png"
              alt="Busy NYC restaurant dining room with three servers tracked by performance metrics"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
            />

            {/* Subtle gradient overlay for text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Server Metric Callouts */}
            {serverMetrics.map((server) => (
              <ServerCallout key={server.id} server={server} />
            ))}

            {/* Corner label */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
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
