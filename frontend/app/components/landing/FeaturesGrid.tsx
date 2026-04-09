const features = [
  {
    title: "Weekly Scorecards",
    body: "Instantly rank your team from top to bottom based on real sales data, not just gut feelings.",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Table Turn Speed",
    body: "See exactly who turns tables the fastest and who gets stuck in the weeds on busy nights.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Upsell Metrics",
    body: "Find out which servers are successfully selling appetizers and wine to boost your average check.",
    icon: (
      <svg viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: "1-Minute Coaching",
    body: "Get customized, data-backed advice on what to tell each server before their shift starts.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    title: "Drag-and-Drop Uploads",
    body: "No tech skills needed. Just drop your Toast export file right into our secure dashboard.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: "Retention Alerts",
    body: "Get alerted when a top-performing server starts slipping, so you can check in before they quit.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function FeaturesGrid() {
  return (
    <section className="border-t border-shift-border bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-5">
        {/* Header */}
        <div className="mb-15 text-center">
          <h2 className="mb-4 text-3xl font-bold text-shift-green md:text-[2.5rem]">
            Everything you need to run a smarter floor.
          </h2>
          <p className="text-lg text-shift-text-light">
            We do the math so you can focus on the hospitality.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-shift-border bg-shift-offwhite px-8 py-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)]"
            >
              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-shift-brown/10 text-shift-brown [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg_line]:stroke-linecap-round [&_svg_polyline]:stroke-linecap-round [&_svg_path]:stroke-linecap-round [&_svg]:stroke-linejoin-round">
                {f.icon}
              </div>
              <h4 className="mb-3 text-xl font-bold text-shift-text-dark">
                {f.title}
              </h4>
              <p className="text-base leading-relaxed text-shift-text-light">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
