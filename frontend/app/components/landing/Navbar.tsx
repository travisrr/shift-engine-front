import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-5">
      <div className="text-2xl font-extrabold tracking-tight text-shift-green">
        ⚙️ Shift-Engine
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="inline-block rounded-md border border-shift-green/30 px-5 py-2.5 text-sm font-semibold text-shift-green transition-all hover:border-shift-green hover:bg-shift-green/5"
        >
          Log In
        </Link>
        <Link
          href="#pricing"
          className="inline-block rounded-md bg-shift-brown px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-shift-brown-hover"
        >
          Get Early Access
        </Link>
      </div>
    </nav>
  );
}
