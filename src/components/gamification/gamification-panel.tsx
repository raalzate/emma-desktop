"use client";

/**
 * Panel «Your journey» en Progreso (#216, H5): nivel de jugador, XP total que
 * cuenta hacia su valor, racha, meta del día, la semana en barras y la galería
 * de logros.
 */

import { CheckCircle2, Target, Trophy } from "lucide-react";
import type { GamificationSummary } from "@/domain/gamification/gamification-summary";
import { dailyGoalTooltip, levelTooltip } from "@/domain/gamification/gamification-tooltips";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { AchievementsGrid } from "./achievements-grid";
import { ProgressRing } from "./progress-ring";
import { StreakFlame } from "./streak-flame";
import { WeeklyXpChart } from "./weekly-xp-chart";
import { useGamification } from "./use-gamification";

function Tile({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-bubble border border-border bg-background p-4", className)}>
      {children}
    </div>
  );
}

function LevelTile({ summary }: { summary: GamificationSummary }) {
  const { level } = summary;
  return (
    <Tile>
      <ProgressRing value={level.progress} size={104} stroke={9} title={levelTooltip(level)}>
        <span className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">Level</span>
        <span className="font-headline text-3xl font-bold leading-none">{level.level}</span>
      </ProgressRing>
      <div className="min-w-0 space-y-1">
        <p className="font-headline text-lg font-semibold">{level.title}</p>
        <p className="flex items-baseline gap-1">
          <AnimatedNumber value={summary.totalXp} className="font-headline text-2xl font-bold tabular-nums" />
          <span className="text-sm text-muted-foreground">XP</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {level.xpForLevel - level.xpIntoLevel} XP to level {level.level + 1}
        </p>
      </div>
    </Tile>
  );
}

function StreakTile({ summary }: { summary: GamificationSummary }) {
  const { streak, week } = summary;
  return (
    <Tile>
      <StreakFlame streak={streak} size="lg" />
      <div className="space-y-2">
        <p className="text-sm font-medium">day streak</p>
        <p className="text-xs text-muted-foreground">Best: {streak.best} days</p>
        <ul className="flex gap-1" aria-label="Last 7 days">
          {week.map((d) => (
            <li
              key={d.day}
              className={cn("h-2.5 w-2.5 rounded-full", d.xp > 0 ? "bg-accent motion-safe:animate-pop-in" : "bg-muted")}
            />
          ))}
        </ul>
      </div>
    </Tile>
  );
}

function GoalTile({ summary }: { summary: GamificationSummary }) {
  const { dailyGoal } = summary;
  return (
    <Tile className={cn(dailyGoal.met && "border-accent/60")}>
      <span title={dailyGoalTooltip(dailyGoal)} className={cn("rounded-full", dailyGoal.met && "motion-safe:animate-glow-pulse")}>
        <ProgressRing value={dailyGoal.progress} size={84} stroke={8} barClassName="stroke-accent">
          {dailyGoal.met ? (
            <CheckCircle2 className="h-7 w-7 text-accent motion-safe:animate-pop-in" aria-hidden />
          ) : (
            <Target className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
        </ProgressRing>
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{dailyGoal.met ? "Goal reached!" : "Daily goal"}</p>
        <p className="font-headline text-xl font-bold tabular-nums">
          {dailyGoal.earned}
          <span className="text-sm font-normal text-muted-foreground"> / {dailyGoal.target} XP</span>
        </p>
      </div>
    </Tile>
  );
}

export function GamificationPanelView({ summary }: { summary: GamificationSummary }) {
  return (
    <section className="space-y-6 rounded-bubble border border-border bg-card p-5">
      <p className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" aria-hidden />
        Your journey
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <LevelTile summary={summary} />
        <StreakTile summary={summary} />
        <GoalTile summary={summary} />
      </div>
      <WeeklyXpChart week={summary.week} goal={summary.dailyGoal.target} />
      <AchievementsGrid achievements={summary.achievements} />
    </section>
  );
}

export function GamificationPanel() {
  const summary = useGamification();
  if (!summary) return null;
  return <GamificationPanelView summary={summary} />;
}
