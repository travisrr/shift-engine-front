import Link from "next/link";

const perks = [
  "Unlimited servers",
  "Weekly performance scorecards",
  "Drag-and-drop CSV uploads",
  "Actionable coaching insights",
  "Historical trend tracking",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-shift-border bg-shift-offwhite py-24 text-center"
    >
      <div className="mx-auto max-w-[1200px] px-5">
        {/* Header */}
        <div className="mb-15 text-center">
          <h2 className="mb-4 text-3xl font-bold text-shift-green md:text-[2.5rem]">
            Simple, transparent pricing.
          </h2>
          <p className="text-lg text-shift-text-light">
            One flat rate. Everything you need to run a smarter floor.
          </p>
        </div>

        {/* Card */}
        <div className="mx-auto mt-10 max-w-[450px] rounded-xl border-2 border-shift-green bg-white px-10 py-12 shadow-[0_20px_40px_rgba(58,79,57,0.1)] max-md:mx-5">
          <h3 className="mb-3 text-2xl font-bold text-shift-green">
            All Access Plan
          </h3>

          <div className="mb-8 text-shift-text-dark">
            <span className="text-6xl font-extrabold">$75</span>
            <span className="text-xl font-normal text-shift-text-light">
              /mo
            </span>
          </div>

          <p className="mb-6 font-bold text-shift-green">Per Location</p>

          <ul className="mb-10 space-y-4 text-left">
            {perks.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-3 text-lg text-shift-text-dark"
              >
                <span className="font-bold text-shift-brown">✓</span>
                {perk}
              </li>
            ))}
          </ul>

          <Link
            href="#"
            className="block w-full rounded-md bg-shift-brown py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-shift-brown-hover"
          >
            Start 14-Day Free Trial
          </Link>
        </div>
      </div>
    </section>
  );
}
