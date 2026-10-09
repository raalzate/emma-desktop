"use client";

/**
 * Llama de la racha diaria: parpadea mientras la racha vive, se apaga (gris)
 * en cero y lleva un punto si hoy todavía no se practicó (la racha está en
 * juego).
 */

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyStreak } from "@/domain/gamification/daily-streak";
import { streakTooltip } from "@/domain/gamification/gamification-tooltips";

const ICON_SIZE = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" } as const;
const TEXT_SIZE = { sm: "text-sm", md: "text-xl", lg: "text-4xl" } as const;

export function StreakFlame({
  streak,
  size = "md",
  className,
}: {
  streak: DailyStreak;
  size?: keyof typeof ICON_SIZE;
  className?: string;
}) {
  const alive = streak.current > 0;
  return (
    <span className={cn("relative inline-flex items-center gap-1.5", className)} title={streakTooltip(streak)}>
      <span className="relative inline-flex">
        <Flame
          aria-hidden
          className={cn(
            ICON_SIZE[size],
            "origin-bottom",
            alive ? "fill-accent/70 text-accent motion-safe:animate-flame-flicker" : "text-muted-foreground/50",
          )}
        />
        {alive && !streak.activeToday && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-scaffold-hard motion-safe:animate-pulse" />
        )}
      </span>
      <span
        className={cn(
          "font-headline font-bold tabular-nums",
          TEXT_SIZE[size],
          alive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {streak.current}
      </span>
    </span>
  );
}
