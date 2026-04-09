"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface PhotoSectionProps {
  children: ReactNode;
  imageSrc: string;
  imageAlt: string;
  overlayOpacity?: number; // 0-100, default 75
  overlayColor?: "dark" | "green" | "light";
  minHeight?: string;
  className?: string;
}

export default function PhotoSection({
  children,
  imageSrc,
  imageAlt,
  overlayOpacity = 75,
  overlayColor = "dark",
  minHeight = "400px",
  className = "",
}: PhotoSectionProps) {
  const overlayMap = {
    dark: `rgba(0,0,0,${overlayOpacity / 100})`,
    green: `rgba(58,79,57,${overlayOpacity / 100})`,
    light: `rgba(247,246,243,${overlayOpacity / 100})`,
  };

  return (
    <section className={`relative overflow-hidden ${className}`} style={{ minHeight }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="100vw"
        />
        {/* Color overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayMap[overlayColor] }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24">
        {children}
      </div>
    </section>
  );
}

// Smaller accent image component for inline use
interface PhotoAccentProps {
  imageSrc: string;
  imageAlt: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "wide";
  rounded?: boolean;
  shadow?: boolean;
}

export function PhotoAccent({
  imageSrc,
  imageAlt,
  className = "",
  aspectRatio = "landscape",
  rounded = true,
  shadow = true,
}: PhotoAccentProps) {
  const aspectMap = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    wide: "aspect-[16/9]",
  };

  return (
    <div
      className={`relative overflow-hidden ${aspectMap[aspectRatio]} ${rounded ? "rounded-2xl" : ""} ${shadow ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)]" : ""} ${className}`}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
