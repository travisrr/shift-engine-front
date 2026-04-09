"use client";

import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface SpeedLine {
  id: number;
  x: number;
  y: number;
  width: number;
  angle: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function WhispyBackground({
  intensity = "medium",
  className = "",
}: {
  intensity?: "low" | "medium" | "high";
  className?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [speedLines, setSpeedLines] = useState<SpeedLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  // REDUCED: Significantly lower counts for performance
  // Original: 15 particles, 8 speed lines, 6 wisps, 3 orbs
  // New: 5-8 particles, 3-4 speed lines, no wisps (most expensive), 2 orbs
  useEffect(() => {
    // Reduced multipliers for better performance
    const multiplier = intensity === "low" ? 0.4 : intensity === "high" ? 0.8 : 0.6;

    // Generate floating particles (dust motes) - REDUCED
    const newParticles: Particle[] = Array.from(
      { length: Math.floor(6 * multiplier) },
      (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1, // Smaller particles
        duration: Math.random() * 20 + 20, // Slower animation
        delay: Math.random() * 10,
        opacity: Math.random() * 0.2 + 0.1, // Lower opacity
      })
    );
    setParticles(newParticles);

    // Generate speed lines (motion streaks) - REDUCED
    const newSpeedLines: SpeedLine[] = Array.from(
      { length: Math.floor(3 * multiplier) },
      (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: Math.random() * 100 + 50,
        angle: Math.random() * 30 - 15,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.1 + 0.05,
      })
    );
    setSpeedLines(newSpeedLines);
  }, [intensity]);

  // IntersectionObserver to pause expensive animations when off-screen
  useEffect(() => {
    if (!containerRef.current || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
        // Toggle CSS animation play state based on visibility
        if (containerRef.current) {
          containerRef.current.style.animationPlayState = isVisibleRef.current
            ? "running"
            : "paused";
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Floating Particles - subtle dust motes */}
      {particles.map((p) => (
        <div
          key={`particle-${p.id}`}
          className="whispy-particle absolute rounded-full bg-shift-green"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // OPTIMIZED: Use will-change only on animated elements
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* Speed Lines - motion streaks */}
      {speedLines.map((line) => (
        <div
          key={`speedline-${line.id}`}
          className="whispy-speedline absolute h-[1px] bg-gradient-to-r from-transparent via-shift-green-accent/30 to-transparent"
          style={{
            left: `${line.x}%`,
            top: `${line.y}%`,
            width: `${line.width}px`,
            transform: `rotate(${line.angle}deg)`,
            opacity: line.opacity,
            animationDuration: `${line.duration}s`,
            animationDelay: `${line.delay}s`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* REMOVED: Steam Wisps - these had expensive SVG path morphing animations
       * that were causing significant GPU load. The speed lines + particles
       * provide enough atmospheric motion without the complexity.
       */}

      {/* Ambient Gradient Orbs - soft floating color washes - REDUCED from 3 to 2 */}
      <div
        className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-shift-green/5 blur-3xl"
        style={{
          animation: "orb-pulse 15s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-shift-brown/5 blur-3xl"
        style={{
          animationDelay: "3s",
          animation: "orb-pulse 15s ease-in-out infinite 3s",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
