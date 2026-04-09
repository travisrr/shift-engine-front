"use client";

import { useEffect, useState } from "react";

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

interface Wisp {
  id: number;
  x: number;
  y: number;
  scale: number;
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
  const [wisps, setWisps] = useState<Wisp[]>([]);

  useEffect(() => {
    const multiplier = intensity === "low" ? 0.5 : intensity === "high" ? 1.5 : 1;

    // Generate floating particles (dust motes)
    const newParticles: Particle[] = Array.from({ length: Math.floor(15 * multiplier) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(newParticles);

    // Generate speed lines (diagonal motion streaks)
    const newSpeedLines: SpeedLine[] = Array.from({ length: Math.floor(8 * multiplier) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: Math.random() * 150 + 50,
      angle: Math.random() * 30 - 15, // -15 to 15 degrees
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.15 + 0.05,
    }));
    setSpeedLines(newSpeedLines);

    // Generate steam wisps
    const newWisps: Wisp[] = Array.from({ length: Math.floor(6 * multiplier) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * 15,
      opacity: Math.random() * 0.2 + 0.1,
    }));
    setWisps(newWisps);
  }, [intensity]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
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
          }}
        />
      ))}

      {/* Speed Lines - motion streaks suggesting fast movement */}
      {speedLines.map((line) => (
        <div
          key={`speedline-${line.id}`}
          className="whispy-speedline absolute h-[1px] bg-gradient-to-r from-transparent via-shift-green-accent/40 to-transparent"
          style={{
            left: `${line.x}%`,
            top: `${line.y}%`,
            width: `${line.width}px`,
            transform: `rotate(${line.angle}deg)`,
            opacity: line.opacity,
            animationDuration: `${line.duration}s`,
            animationDelay: `${line.delay}s`,
          }}
        />
      ))}

      {/* Steam Wisps - soft rising effects like kitchen steam */}
      {wisps.map((wisp) => (
        <div
          key={`wisp-${wisp.id}`}
          className="whispy-wisp absolute"
          style={{
            left: `${wisp.x}%`,
            top: `${wisp.y}%`,
            transform: `scale(${wisp.scale})`,
            opacity: wisp.opacity,
            animationDuration: `${wisp.duration}s`,
            animationDelay: `${wisp.delay}s`,
          }}
        >
          <svg
            width="120"
            height="80"
            viewBox="0 0 120 80"
            fill="none"
            className="text-shift-brown/30"
          >
            <path
              d="M20 70 Q 30 40, 25 20 T 30 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="wisp-path-1"
            />
            <path
              d="M45 75 Q 55 45, 50 25 T 55 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="wisp-path-2"
            />
            <path
              d="M70 72 Q 80 42, 75 22 T 80 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="wisp-path-3"
            />
          </svg>
        </div>
      ))}

      {/* Ambient Gradient Orbs - soft floating color washes */}
      <div className="whispy-orb absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-shift-green/5 blur-3xl" />
      <div
        className="whispy-orb absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-shift-brown/5 blur-3xl"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="whispy-orb absolute left-1/3 -bottom-32 h-64 w-64 rounded-full bg-shift-green-accent/5 blur-3xl"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}
