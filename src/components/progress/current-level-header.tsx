"use client";

/** Cabecera de "Mi progreso": título, badge del nivel actual y escalera CEFR. */

import { Badge } from "@/components/ui/badge";
import { LevelLadder } from "./level-ladder";

export function CurrentLevelHeader({ level }: { level: string }) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My progress</h1>
        <Badge className="text-sm">{level}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Your CEFR journey from A1 to C1. Pass the scenarios at your level to move up.
      </p>
      <LevelLadder current={level} />
    </header>
  );
}
