"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // depth layer (0 = foreground, 1 = background)
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  blur: number;
}

interface PointillismBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  maxConnections?: number;
}

export default function PointillismBackground({
  className = "",
  particleCount = 280,
  connectionDistance = 120,
  maxConnections = 3,
}: PointillismBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Initialize particles with depth layers for volumetric effect
  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Create depth distribution - more particles in mid-ground
        const depthRandom = Math.random();
        const z =
          depthRandom < 0.15
            ? 0.1 + Math.random() * 0.2 // foreground (15%)
            : depthRandom < 0.75
              ? 0.3 + Math.random() * 0.4 // mid-ground (60%)
              : 0.7 + Math.random() * 0.3; // background (25%)

        // Size varies by depth (closer = larger)
        const baseSize = z < 0.3 ? 2.5 : z < 0.6 ? 1.8 : 1.2;
        const size = baseSize + Math.random() * 0.8;

        // Opacity varies by depth
        const baseOpacity = z < 0.3 ? 0.45 : z < 0.6 ? 0.35 : 0.2;
        const opacity = baseOpacity + Math.random() * 0.15;

        // Blur based on depth (shallow depth of field effect)
        const blur = z > 0.7 ? 2 + Math.random() * 2 : z > 0.4 ? 0.5 : 0;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * (z < 0.4 ? 0.4 : 0.15),
          vy: (Math.random() - 0.5) * (z < 0.4 ? 0.4 : 0.15),
          size,
          opacity,
          blur,
        });
      }

      return particles;
    },
    [particleCount]
  );

  // Draw the pointillism frame
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Clear with stark white (high-key lighting)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Sort by depth (draw background first)
      const sortedParticles = [...particles].sort((a, b) => b.z - a.z);

      // Draw connections (plexus mesh) - only for mid and foreground particles
      ctx.lineWidth = 0.5;

      for (let i = 0; i < sortedParticles.length; i++) {
        const p1 = sortedParticles[i];
        if (p1.z > 0.6) continue; // Don't connect distant background particles

        let connections = 0;

        for (let j = i + 1; j < sortedParticles.length; j++) {
          const p2 = sortedParticles[j];
          if (p2.z > 0.6) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connection distance varies by depth
          const depthAdjustedDistance =
            connectionDistance * (1 - (p1.z + p2.z) * 0.3);

          if (dist < depthAdjustedDistance && connections < maxConnections) {
            // Opacity based on distance and depth
            const normalizedDist = dist / depthAdjustedDistance;
            const lineOpacity =
              (1 - normalizedDist) * 0.15 * (1 - (p1.z + p2.z) * 0.4);

            // Charcoal-grey connections
            ctx.strokeStyle = `rgba(80, 85, 90, ${lineOpacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            connections++;
          }
        }
      }

      // Draw particles with depth-of-field blur
      for (const p of sortedParticles) {
        // Skip if far off-screen
        if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
          continue;
        }

        ctx.save();

        // Apply blur for depth-of-field effect
        if (p.blur > 0) {
          ctx.filter = `blur(${p.blur}px)`;
        }

        // Draw stippled particle with volumetric shading
        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(70, 75, 80, ${p.opacity})`;
        ctx.fill();

        // Outer stippling for depth effect (simulating 3D form)
        if (p.z < 0.5) {
          const stippleCount = Math.floor(4 + (1 - p.z) * 6);
          for (let s = 0; s < stippleCount; s++) {
            const angle = (s / stippleCount) * Math.PI * 2 + Math.random() * 0.5;
            const stippleDist = p.size * (1.3 + Math.random() * 0.8);
            const sx = p.x + Math.cos(angle) * stippleDist;
            const sy = p.y + Math.sin(angle) * stippleDist;
            const sSize = 0.5 + Math.random() * 0.5;

            ctx.beginPath();
            ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(90, 95, 100, ${p.opacity * 0.5})`;
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // Subtle radial gradient overlay for high-key lighting effect
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        0,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
      gradient.addColorStop(1, "rgba(250, 250, 252, 0.15)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    [connectionDistance, maxConnections]
  );

  // Animation loop
  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Gentle mouse repulsion for interactivity
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        // Velocity dampening
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Gentle return to base movement
        const targetVx = (Math.random() - 0.5) * (p.z < 0.4 ? 0.3 : 0.1);
        const targetVy = (Math.random() - 0.5) * (p.z < 0.4 ? 0.3 : 0.1);
        p.vx += (targetVx - p.vx) * 0.001;
        p.vy += (targetVy - p.vy) * 0.001;

        // Wrap around edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }

      draw(ctx, width, height);
      animationRef.current = requestAnimationFrame(() => animate(ctx, width, height));
    },
    [draw]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize particles
    particlesRef.current = initParticles(rect.width, rect.height);

    // Start animation
    animationRef.current = requestAnimationFrame(() => animate(ctx, rect.width, rect.height));

    // Handle resize
    const handleResize = () => {
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      ctx.scale(dpr, dpr);
      particlesRef.current = initParticles(newRect.width, newRect.height);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
