"use client";

/**
 * Barras de XP de los últimos 7 días con la línea de la meta diaria. Las barras
 * crecen escalonadas al montar; hoy va resaltado.
 */

import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayXp } from "@/domain/gamification/gamification-summary";
import { weekDayTooltip } from "@/domain/gamification/gamification-tooltips";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MS_PER_DAY = 86_400_000;

/** El día ya es local (días desde epoch corridos por la zona): se lee en UTC. */
export function weekdayOf(day: number): string {
  return WEEKDAYS[new Date(day * MS_PER_DAY).getUTCDay()];
}

export function WeeklyXpChart({ week, goal }: { week: DayXp[]; goal: number }) {
  const max = Math.max(goal, ...week.map((d) => d.xp)) * 1.15;
  const goalPct = (goal / max) * 100;
  const total = week.reduce((s, d) => s + d.xp, 0);
  const lastIndex = week.length - 1;

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-muted-foreground">
        <BarChart3 className="h-3.5 w-3.5" aria-hidden />
        This week · {total} XP
      </p>
      <div className="relative h-36">
        <div
          className="absolute inset-x-0 border-t border-dashed border-accent/70"
          style={{ bottom: `${goalPct}%` }}
          aria-hidden
        >
          <span className="absolute -top-4 right-0 font-code text-[10px] text-accent">goal {goal}</span>
        </div>
        <ul className="absolute inset-0 flex items-end gap-2">
          {week.map((d, i) => {
            const isToday = i === lastIndex;
            const met = d.xp >= goal;
            return (
              <li
                key={d.day}
                title={weekDayTooltip(d.xp, isToday)}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="font-code text-[10px] tabular-nums text-muted-foreground">{d.xp > 0 ? d.xp : ""}</span>
                <span
                  className={cn(
                    "w-full max-w-10 origin-bottom rounded-t-md motion-safe:animate-bar-grow",
                    met ? "bg-accent" : isToday ? "bg-primary" : "bg-primary/40",
                    d.xp === 0 && "bg-muted",
                  )}
                  style={{ height: `${Math.max(3, (d.xp / max) * 100)}%`, animationDelay: `${i * 70}ms` }}
                />
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="flex gap-2">
        {week.map((d, i) => (
          <li
            key={d.day}
            className={cn(
              "flex-1 text-center font-code text-[10px] uppercase",
              i === lastIndex ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {i === lastIndex ? "Today" : weekdayOf(d.day)}
          </li>
        ))}
      </ul>
    </div>
  );
}
