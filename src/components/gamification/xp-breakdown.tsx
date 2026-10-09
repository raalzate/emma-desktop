"use client";

/** Desglose del XP de una sesión en la lección de cierre (#216, H6). */

import { Sparkles } from "lucide-react";
import type { XpLine } from "@/domain/gamification/xp-rules";
import { AnimatedNumber } from "./animated-number";

export function XpBreakdown({ lines, total }: { lines: XpLine[]; total: number }) {
  if (lines.length === 0) return null;
  return (
    <section className="rounded-lg border border-primary/30 bg-primary-soft/60 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          XP earned
        </p>
        <p className="font-headline text-2xl font-bold text-primary-deep">
          +<AnimatedNumber value={total} />
        </p>
      </div>
      <ul className="mt-2 space-y-1">
        {lines.map((line, i) => (
          <li
            key={`${line.label}-${i}`}
            className="flex justify-between text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2"
            style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
          >
            <span>{line.label}</span>
            <span className="font-code tabular-nums text-muted-foreground">+{line.xp}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
