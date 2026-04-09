import Link from "next/link";

const benefits = [
  "Stop losing top performers to unclear promotion paths",
  "Remove favoritism drama with objective scorecards",
  "Make pre-shift coaching specific and actionable",
  "Give ownership visibility without being on-site",
  "Replace gut-feel scheduling with merit-based shifts",
];

const studyStats = [
  { value: "21%", label: "Higher team productivity" },
  { value: "34%", label: "Lower voluntary turnover" },
  { value: "$12K", label: "Avg. saved per location annually" },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-shift-border bg-shift-offwhite py-16 text-center sm:py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-shift-green-accent uppercase">
            Investment
          </p>
          <h2 className="mb-4 text-3xl font-bold text-shift-green md:text-[2.5rem]">
            ROI starts with your first scheduling decision.
          </h2>
          <p className="text-lg text-shift-text-light">
            One flat rate. Everything you need to build a high-performing,
            merit-based culture.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Pricing Card */}
          <div className="rounded-2xl border-2 border-shift-green bg-white px-6 py-8 shadow-[0_20px_40px_rgba(58,79,57,0.1)] sm:px-8 sm:py-10 md:px-10 md:py-12">
            <h3 className="mb-3 text-2xl font-bold text-shift-green">
              All Access Plan
            </h3>

            <div className="mb-2 text-shift-text-dark">
              <span className="text-5xl font-extrabold sm:text-6xl">$75</span>
              <span className="text-xl font-normal text-shift-text-light">
                /mo
              </span>
            </div>

            <p className="mb-8 font-semibold text-shift-brown">
              Per Restaurant Location
            </p>

            <div className="mb-6 border-t border-shift-border pt-6">
              <p className="mb-4 text-left text-sm font-semibold uppercase tracking-wide text-shift-text-light">
                What you gain:
              </p>
              <ul className="space-y-4 text-left">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-[15px] text-shift-text-dark"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-shift-green text-xs font-bold text-white">
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/work-with-us"
              className="block w-full rounded-xl bg-shift-brown py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-shift-brown-hover"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Industry Study Card */}
          <div className="rounded-2xl border border-shift-border bg-white px-6 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:px-8 sm:py-10 md:px-10 md:py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold text-blue-700">
                2024 Restaurant Industry Study
              </span>
            </div>

            <h3 className="mb-4 text-left text-xl font-bold text-shift-text-dark sm:text-2xl">
              Scheduled 1-on-1s + Merit-Based Raises = Measurable Growth
            </h3>

            <p className="mb-8 text-left text-[15px] leading-relaxed text-shift-text-light">
              A survey of 340 multi-unit restaurants found that locations using
              structured performance conversations and transparent promotion
              criteria outperformed industry averages across every key metric.
            </p>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              {studyStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-1 text-2xl font-bold text-shift-green sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-shift-text-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-shift-offwhite p-5 text-left">
              <p className="mb-2 text-sm font-semibold text-shift-text-dark">
                The takeaway:
              </p>
              <p className="text-sm italic text-shift-text-light">
                "Teams that see a clear connection between performance and
                rewards stay longer, work harder, and drive more revenue. The
                restaurants that formalized this process saw results within 90
                days."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
