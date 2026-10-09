"use client";

/** Cabecera de "Mi progreso": título, badge del nivel actual y escalera de niveles. */

import { Badge } from "@/components/ui/badge";
import { levelLabel } from "@/domain/cefr/cefr-ladder";
import { LevelLadder } from "./level-ladder";

export function CurrentLevelHeader({ level }: { level: string }) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My progress</h1>
        <Badge className="text-sm">{levelLabel(level)}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Your journey from Level 1 to Level 5. Pass the scenarios at your level to move up.
      </p>
      <LevelLadder current={level} />
    </header>
  );
}
