"use client";

/**
 * Confeti sólo con CSS: piezas con posición, deriva, giro y retraso
 * deterministas (por índice) para que el render sea estable y probable. Con
 * `prefers-reduced-motion` no se pinta.
 */

import { cn } from "@/lib/utils";

const COLORS = ["bg-primary", "bg-accent", "bg-scaffold-easy", "bg-cat-2", "bg-cat-4", "bg-scaffold-hard"] as const;

export interface ConfettiPiece {
  left: number;
  delayMs: number;
  durationMs: number;
  dx: number;
  rotation: number;
  color: string;
  round: boolean;
}

export function confettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: (i * 37) % 100,
    delayMs: (i % 12) * 60,
    durationMs: 2200 + (i % 5) * 300,
    dx: ((i * 53) % 240) - 120,
    rotation: 180 + ((i * 97) % 720),
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  }));
}

export function Confetti({ count = 70 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden">
      {confettiPieces(count).map((p, i) => (
        <span
          key={i}
          className={cn("absolute top-0 block animate-confetti-fall", p.color, p.round ? "h-2 w-2 rounded-full" : "h-3 w-1.5 rounded-sm")}
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delayMs}ms`,
              "--confetti-duration": `${p.durationMs}ms`,
              "--confetti-dx": `${p.dx}px`,
              "--confetti-rot": `${p.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
