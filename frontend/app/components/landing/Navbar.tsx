import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-shift-border bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo - aligned to left edge of container */}
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-shift-green sm:gap-3 sm:text-2xl">
          <Image
            src="/shift-engine-logo-bw-nobg.webp"
            alt="Shift-Engine Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <span>Shift-Engine</span>
        </Link>

        {/* Center nav links - hidden on mobile */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="#testimonials"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-shift-green hover:text-shift-green hover:bg-shift-green/5"
          >
            Testimonials
          </Link>
          <Link
            href="#articles"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-shift-green hover:text-shift-green hover:bg-shift-green/5"
          >
            Articles
          </Link>
        </div>

        {/* Right side buttons - aligned to right edge of container */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-md border border-shift-green/30 px-3 py-2 text-sm font-semibold text-shift-green transition-all hover:border-shift-green hover:bg-shift-green/5 sm:inline-block sm:px-4"
          >
            Log In
          </Link>
          <Link
            href="#pricing"
            className="inline-block rounded-md bg-shift-brown px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-shift-brown-hover sm:px-5"
          >
            <span className="sm:hidden">Get Access</span>
            <span className="hidden sm:inline">Get Early Access</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
