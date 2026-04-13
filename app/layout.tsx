import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootChrome from "./components/RootChrome";

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
      <body className="relative min-h-full bg-[#f7f6f3] font-sans text-black">
        <RootChrome>{children}</RootChrome>
      </body>
    </html>
  );
}
