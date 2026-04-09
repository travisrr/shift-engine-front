import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Shift-Engine | Restaurant Performance Software",
  description:
    "Drop your Toast POS data into Shift-Engine. Instantly see who to reward, who to coach, and who gets the busy Friday shifts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="bg-shift-green px-6 py-8 text-shift-offwhite">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <Link className="transition hover:opacity-80" href="/work-with-us">
                  Work with us
                </Link>
                <Link className="transition hover:opacity-80" href="/privacy-policy">
                  Privacy Policy
                </Link>
                <Link
                  className="transition hover:opacity-80"
                  href="/terms-and-conditions"
                >
                  Terms and Conditions
                </Link>
              </nav>
              <p>Made in Nashville with 🖤</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
