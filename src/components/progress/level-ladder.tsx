"use client";

/**
 * Escalera CEFR A1→C1 como pills `font-code` conectadas (FR-025): los niveles
 * completados van rellenos de primary, el actual lleva borde primary (y el %
 * del pathway si la vista lo conoce) y los futuros quedan apagados.
 */

import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";
import { levelState, LevelState } from "@/domain/pathway/roadmap";
import { cn } from "@/lib/utils";

export function LevelLadder({ current, percent }: { current: string; percent?: number }) {
  return (
    <ol className="flex items-center" aria-label="Escalera CEFR">
      {CEFR_LADDER.map((level, i) => (
        <LadderStep
          key={level}
          level={level}
          state={levelState(level, current)}
          first={i === 0}
          percent={percent}
        />
      ))}
    </ol>
  );
}

/** Clases de la pill según el estado del peldaño (completado / actual / próximo). */
function pillClass(done: boolean, active: boolean): string {
  return cn(
    "flex h-8 items-center justify-center rounded-full px-3 font-code text-xs font-semibold",
    done && "bg-primary text-primary-foreground",
    active && "border-2 border-primary bg-background text-primary",
    !done && !active && "bg-secondary text-muted-foreground",
  );
}

function LadderStep({
  level,
  state,
  first,
  percent,
}: {
  level: string;
  state: LevelState;
  first: boolean;
  percent?: number;
}) {
  const done = state === LevelState.COMPLETED;
  const active = state === LevelState.IN_PROGRESS;
  return (
    <li className="flex items-center">
      {!first && (
        <span className={cn("h-0.5 w-4 sm:w-8", done || active ? "bg-primary" : "bg-border")} />
      )}
      <span className={pillClass(done, active)} aria-current={active ? "step" : undefined}>
        {level}
        {active && typeof percent === "number" && (
          <span className="ml-1.5 font-normal">· {percent}%</span>
        )}
      </span>
    </li>
  );
}
