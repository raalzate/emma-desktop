"use client";

/**
 * Tarjeta de jugador en la barra lateral (#216, H5): nivel en un anillo, barra
 * de XP, racha y meta del día. Siempre a la vista: si la recompensa no se ve
 * desde la navegación, no existe para el aprendiz. Lleva a Progreso.
 */

import Link from "next/link";
import type { GamificationSummary } from "@/domain/gamification/gamification-summary";
import { dailyGoalTooltip, levelTooltip } from "@/domain/gamification/gamification-tooltips";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";
import { StreakFlame } from "./streak-flame";
import { useGamification } from "./use-gamification";
import { useRevealedValue } from "./motion-utils";

export function PlayerCardView({ summary }: { summary: GamificationSummary }) {
  const { level, streak, dailyGoal } = summary;
  const barPct = useRevealedValue(level.progress) * 100;
  return (
    <Link
      href="/progress"
      title="Tu nivel de jugador, racha y meta del día — abrí Progreso para ver tus logros"
      className="group block space-y-3 rounded-bubble border border-border bg-background p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-3">
        <ProgressRing value={level.progress} size={52} stroke={5} title={levelTooltip(level)}>
          <span className="font-headline text-lg font-bold leading-none">{level.level}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-headline text-sm font-semibold">{level.title}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-out motion-reduce:transition-none"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className="font-code text-[10px] tabular-nums text-muted-foreground">
            {level.xpIntoLevel} / {level.xpForLevel} XP
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StreakFlame streak={streak} size="sm" />
        <span className="flex items-center gap-1.5" title={dailyGoalTooltip(dailyGoal)}>
          <ProgressRing
            value={dailyGoal.progress}
            size={22}
            stroke={3}
            barClassName="stroke-accent"
            className={cn("rounded-full", dailyGoal.met && "motion-safe:animate-glow-pulse")}
          />
          <span className="font-code text-[10px] tabular-nums text-muted-foreground">
            {dailyGoal.earned}/{dailyGoal.target} today
          </span>
        </span>
      </div>
    </Link>
  );
}

export function PlayerCard() {
  const summary = useGamification();
  if (!summary) return null;
  return <PlayerCardView summary={summary} />;
}
