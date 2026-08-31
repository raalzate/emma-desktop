"use client";

/** Stepper CEFR A1→C1: peldaños completados, el actual resaltado y los próximos. */

import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";
import { levelState, LevelState } from "@/domain/pathway/roadmap";
import { cn } from "@/lib/utils";

export function LevelLadder({ current }: { current: string }) {
  return (
    <ol className="flex items-center" aria-label="Escalera CEFR">
      {CEFR_LADDER.map((level, i) => (
        <LadderStep key={level} level={level} state={levelState(level, current)} first={i === 0} />
      ))}
    </ol>
  );
}

/** Clase del círculo según el estado del peldaño (completado / actual / próximo). */
function stepClass(done: boolean, active: boolean): string {
  return cn(
    "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold",
    done && "border-primary bg-primary text-primary-foreground",
    active && "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1",
    !done && !active && "border-muted-foreground/30 text-muted-foreground",
  );
}

function LadderStep({ level, state, first }: { level: string; state: LevelState; first: boolean }) {
  const done = state === LevelState.COMPLETED;
  const active = state === LevelState.IN_PROGRESS;
  return (
    <li className="flex items-center">
      {!first && <span className={cn("h-0.5 w-6 sm:w-10", done || active ? "bg-primary" : "bg-muted")} />}
      <span className={stepClass(done, active)} aria-current={active ? "step" : undefined}>
        {level}
      </span>
    </li>
  );
}
