"use client";

/**
 * Medalla de un logro: desbloqueada brilla (barrido de luz) en el color de su
 * rango; bloqueada queda en gris con un anillo de avance hacia la meta.
 */

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/domain/gamification/achievements";
import { ACHIEVEMENT_ICONS, TIER_STYLES } from "./achievement-visuals";

export function AchievementMedal({
  achievement,
  unlocked,
  size = 56,
  className,
}: {
  achievement: Achievement;
  unlocked: boolean;
  size?: number;
  className?: string;
}) {
  const Icon = ACHIEVEMENT_ICONS[achievement.icon];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2",
        unlocked ? TIER_STYLES[achievement.tier].medal : "bg-muted text-muted-foreground/60 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon aria-hidden style={{ width: size * 0.45, height: size * 0.45 }} />
      {unlocked ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-shine"
        />
      ) : (
        <Lock aria-hidden className="absolute bottom-1 right-1 h-3 w-3 text-muted-foreground" />
      )}
    </span>
  );
}
