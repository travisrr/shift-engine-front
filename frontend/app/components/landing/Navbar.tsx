import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-5">
      <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-shift-green">
        <Image 
          src="/shift-engine-logo-bw-nobg.png" 
          alt="Shift-Engine Logo" 
          width={36} 
          height={36} 
          className="object-contain"
        />
        <span>Shift-Engine</span>
      </Link>
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
