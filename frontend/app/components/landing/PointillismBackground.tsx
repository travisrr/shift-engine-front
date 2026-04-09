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
  // Grid cell for spatial partitioning (to avoid O(n²) checks)
  gridX?: number;
  gridY?: number;
}

interface PointillismBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  maxConnections?: number;
  // New prop: pause animation when not visible to save performance
  pauseWhenOffscreen?: boolean;
}

export default function PointillismBackground({
  className = "",
  // REDUCED: Default from 280 to 100 for performance
  particleCount = 100,
  connectionDistance = 100,
  maxConnections = 2,
  pauseWhenOffscreen = true,
}: PointillismBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  const frameSkipRef = useRef(0);

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

        // Blur based on depth (shallow depth of field effect) - REDUCED
        const blur = z > 0.8 ? 1 : z > 0.5 ? 0.5 : 0;

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

  // Spatial grid for efficient neighbor lookups (avoids O(n²))
  const buildSpatialGrid = useCallback(
    (particles: Particle[], cellSize: number, width: number, height: number) => {
      const grid = new Map<string, number[]>();

      particles.forEach((p, index) => {
        const gridX = Math.floor(p.x / cellSize);
        const gridY = Math.floor(p.y / cellSize);
        p.gridX = gridX;
        p.gridY = gridY;

        const key = `${gridX},${gridY}`;
        if (!grid.has(key)) {
          grid.set(key, []);
        }
        grid.get(key)!.push(index);
      });

      return grid;
    },
    []
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

      // OPTIMIZED: Use spatial grid for connections instead of O(n²)
      const cellSize = connectionDistance;
      const grid = buildSpatialGrid(sortedParticles, cellSize, width, height);

      // Draw connections (plexus mesh) - only for mid and foreground particles
      ctx.lineWidth = 0.5;

      for (let i = 0; i < sortedParticles.length; i++) {
        const p1 = sortedParticles[i];
        if (p1.z > 0.6 || p1.gridX === undefined || p1.gridY === undefined) continue;

        let connections = 0;

        // Only check neighboring grid cells (9 cells total)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${p1.gridX + dx},${p1.gridY + dy}`;
            const cellIndices = grid.get(key);
            if (!cellIndices) continue;

            for (const j of cellIndices) {
              if (j <= i) continue; // Avoid duplicate checks

              const p2 = sortedParticles[j];
              if (p2.z > 0.6) continue;

              const distX = p1.x - p2.x;
              const distY = p1.y - p2.y;
              const distSq = distX * distX + distY * distY;

              // Connection distance varies by depth
              const depthAdjustedDistance =
                connectionDistance * (1 - (p1.z + p2.z) * 0.3);
              const distThresholdSq = depthAdjustedDistance * depthAdjustedDistance;

              if (distSq < distThresholdSq && connections < maxConnections) {
                const dist = Math.sqrt(distSq);
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
                if (connections >= maxConnections) break;
              }
            }
            if (connections >= maxConnections) break;
          }
          if (connections >= maxConnections) break;
        }
      }

      // Draw particles with depth-of-field blur
      for (const p of sortedParticles) {
        // Skip if far off-screen
        if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
          continue;
        }

        // OPTIMIZED: Pre-render blurred circles instead of using ctx.filter
        // ctx.filter is expensive and causes GPU texture re-renders
        if (p.blur > 0) {
          // Draw a pre-blurred approximation using radial gradient
          const blurRadius = p.size + p.blur * 2;
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, blurRadius
          );
          const alpha = p.opacity * 0.5;
          gradient.addColorStop(0, `rgba(70, 75, 80, ${alpha})`);
          gradient.addColorStop(1, `rgba(70, 75, 80, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, blurRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Core dot for sharp particles
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(70, 75, 80, ${p.opacity})`;
          ctx.fill();
        }

        // REDUCED: Simplified stippling - only for very close foreground particles
        if (p.z < 0.3) {
          const stippleCount = 3; // Reduced from 4-10
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
    [connectionDistance, maxConnections, buildSpatialGrid]
  );

  // Animation loop with frame skipping when not visible
  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: number) => {
      // Skip frames when not visible (reduce to 10fps instead of 60fps)
      if (!isVisibleRef.current) {
        if (frameSkipRef.current < 5) {
          frameSkipRef.current++;
          animationRef.current = requestAnimationFrame((t) =>
            animate(ctx, width, height, t)
          );
          return;
        }
        frameSkipRef.current = 0;
      }

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Only update mouse repulsion every 3rd frame for performance
      const shouldUpdateMouse = timestamp - lastFrameTimeRef.current > 50;

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Gentle mouse repulsion for interactivity (throttled)
        if (shouldUpdateMouse) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 22500 && distSq > 0) { // 150^2 = 22500
            const dist = Math.sqrt(distSq);
            const force = (150 - dist) / 150;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }

        // Velocity dampening
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Gentle return to base movement (update less frequently when offscreen)
        if (isVisibleRef.current || Math.random() > 0.7) {
          const targetVx = (Math.random() - 0.5) * (p.z < 0.4 ? 0.3 : 0.1);
          const targetVy = (Math.random() - 0.5) * (p.z < 0.4 ? 0.3 : 0.1);
          p.vx += (targetVx - p.vx) * 0.001;
          p.vy += (targetVy - p.vy) * 0.001;
        }

        // Wrap around edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }

      if (shouldUpdateMouse) {
        lastFrameTimeRef.current = timestamp;
      }

      draw(ctx, width, height);
      animationRef.current = requestAnimationFrame((t) =>
        animate(ctx, width, height, t)
      );
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
    animationRef.current = requestAnimationFrame((t) =>
      animate(ctx, rect.width, rect.height, t)
    );

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

    // IntersectionObserver to pause animation when off-screen
    let observer: IntersectionObserver | null = null;
    if (pauseWhenOffscreen && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          isVisibleRef.current = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.1, rootMargin: "100px" }
      );
      observer.observe(canvas);
    }

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      observer?.disconnect();
    };
  }, [initParticles, animate, pauseWhenOffscreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
