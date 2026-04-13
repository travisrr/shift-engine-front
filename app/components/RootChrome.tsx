"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootChrome({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAppRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/login");

  return (
    <div
      className={`relative z-10 flex min-h-screen flex-col ${
        isAppRoute ? "bg-zinc-50" : ""
      }`}
    >
      <main className="flex-1">{children}</main>
      {!isAppRoute && (
        <footer className="border-t-4 border-shift-brown bg-shift-text-dark px-6 py-12 text-white">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Shift Engine</h3>
                <p className="text-sm text-white/80">
                  Restaurant performance software that turns Toast POS data into
                  actionable coaching insights.
                </p>
                <p className="text-sm font-medium">
                  Made in Nashville with <span className="text-xl">🖤</span>
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-shift-offwhite">
                  Legal
                </h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    className="text-sm transition hover:text-white/80"
                    href="/privacy-policy"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    className="text-sm transition hover:text-white/80"
                    href="/terms-and-conditions"
                  >
                    Terms & Conditions
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-shift-offwhite">
                  Contact
                </h4>
                <nav className="flex flex-col gap-2">
                  <a
                    href="mailto:hello@shiftengine.co"
                    className="text-sm transition hover:text-white/80"
                  >
                    hello@shiftengine.co
                  </a>
                  <Link
                    className="text-sm transition hover:text-white/80"
                    href="/work-with-us"
                  >
                    Work with us
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-shift-offwhite">
                  Connect
                </h4>
                <nav className="flex flex-col gap-2">
                  <a
                    href="https://twitter.com/shiftengine"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition hover:text-white/80"
                  >
                    Twitter / X
                  </a>
                  <a
                    href="https://linkedin.com/company/shiftengine"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition hover:text-white/80"
                  >
                    LinkedIn
                  </a>
                </nav>
              </div>
            </div>

            <div className="mt-10 border-t border-white/20 pt-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-white/70">
                  © {new Date().getFullYear()} Shift Engine. All rights
                  reserved.
                </p>
                <p className="text-xs text-white/70">
                  Questions? Email us at{" "}
                  <a
                    href="mailto:support@shiftengine.co"
                    className="underline transition hover:text-white"
                  >
                    support@shiftengine.co
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
