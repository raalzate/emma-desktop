"use client";

/** Galería de logros: desbloqueados primero; cada bloqueado muestra su avance. */

import { Award } from "lucide-react";
import type { AchievementStatus } from "@/domain/gamification/achievements";
import { achievementTooltip } from "@/domain/gamification/gamification-tooltips";
import { AchievementMedal } from "./achievement-medal";

function sortedForDisplay(list: AchievementStatus[]): AchievementStatus[] {
  return [...list].sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress);
}

export function AchievementsGrid({ achievements }: { achievements: AchievementStatus[] }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-muted-foreground">
        <Award className="h-3.5 w-3.5" aria-hidden />
        Achievements · {unlocked}/{achievements.length}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {sortedForDisplay(achievements).map((status, i) => (
          <li
            key={status.achievement.id}
            title={achievementTooltip(status)}
            className="flex flex-col items-center gap-2 rounded-bubble border border-border bg-background p-3 text-center motion-safe:animate-pop-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <AchievementMedal achievement={status.achievement} unlocked={status.unlocked} />
            <span className={status.unlocked ? "text-sm font-semibold" : "text-sm font-medium text-muted-foreground"}>
              {status.achievement.title}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">{status.achievement.description}</span>
            {!status.unlocked && (
              <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary/60 transition-[width] duration-700"
                  style={{ width: `${Math.round(status.progress * 100)}%` }}
                />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
