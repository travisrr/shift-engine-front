import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-5">
      <div className="text-2xl font-extrabold tracking-tight text-shift-green">
        ⚙️ Shift-Engine
      </div>
      <Link
        href="#pricing"
        className="inline-block rounded-md bg-shift-brown px-6 py-3 font-semibold text-white transition-colors hover:bg-shift-brown-hover"
      >
        Get Early Access
      </Link>
    </nav>
  );
}
