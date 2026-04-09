import Link from "next/link";

export default function HeroSection() {
  return (
    <header className="grid grid-cols-1 items-center gap-10 py-12 sm:py-16 md:grid-cols-2 md:gap-15 md:py-20">
      {/* ── Text Column ── */}
      <div className="text-center md:text-left">
        <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-shift-text-dark sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          Stop guessing who your best servers are.
        </h1>
        <p className="mb-8 text-base text-shift-text-light sm:text-lg md:text-xl">
          Drop your Toast POS data into Shift-Engine. Instantly see who to
          reward, who to coach, and who gets the busy Friday shifts.
        </p>
        <Link
          href="#pricing"
          className="inline-block rounded-md bg-shift-brown px-6 py-3 font-semibold text-white transition-colors hover:bg-shift-brown-hover"
        >
          Try it for free
        </Link>
      </div>

      {/* ── Visual Column ── */}
      <div className="relative h-[320px] w-full overflow-hidden rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] sm:h-[380px] md:h-[550px] md:overflow-visible">
        {/* Background image */}
        <div
          className="absolute inset-0 rounded-xl bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-restaurant.webp')" }}
        />
        {/* Green overlay */}
        <div className="absolute inset-0 rounded-xl bg-shift-green/45" />

        {/* ── Floating KPI Badges ── */}
        <div
          className="kpi-badge kpi-badge-1 absolute top-[5%] left-[5%] z-10 hidden animate-float items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[0.95rem] font-bold shadow-[0_10px_25px_rgba(0,0,0,0.3)] md:flex"
        >
          <span className="text-kpi-good">🟢 $201/hr Sales</span>
        </div>

        <div
          className="kpi-badge kpi-badge-2 absolute top-[5%] right-[5%] z-10 hidden animate-float items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[0.95rem] font-bold shadow-[0_10px_25px_rgba(0,0,0,0.3)] md:flex"
          style={{ animationDelay: "1.5s" }}
        >
          <span className="text-kpi-bad">🔴 14% Tip Avg (Rushing)</span>
        </div>

        <div
          className="kpi-badge kpi-badge-3 absolute bottom-[15%] left-[28%] z-10 hidden animate-float items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[0.95rem] font-bold shadow-[0_10px_25px_rgba(0,0,0,0.3)] md:flex"
          style={{ animationDelay: "0.7s" }}
        >
          <span className="text-kpi-good">🟢 $71 Avg Check (Upselling)</span>
        </div>
      </div>
    </header>
  );
}
