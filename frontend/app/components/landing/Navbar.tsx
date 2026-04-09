import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 py-5">
      <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-shift-green sm:gap-3 sm:text-2xl">
        <Image 
          src="/shift-engine-logo-bw-nobg.png" 
          alt="Shift-Engine Logo" 
          width={36} 
          height={36} 
          className="object-contain"
        />
        <span>Shift-Engine</span>
      </Link>
      <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
        <Link
          href="/login"
          className="inline-block rounded-md border border-shift-green/30 px-4 py-2 text-sm font-semibold text-shift-green transition-all hover:border-shift-green hover:bg-shift-green/5 sm:px-5 sm:py-2.5"
        >
          Log In
        </Link>
        <Link
          href="#pricing"
          className="inline-block rounded-md bg-shift-brown px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-shift-brown-hover sm:px-6 sm:py-2.5"
        >
          Get Early Access
        </Link>
      </div>
    </nav>
  );
}
