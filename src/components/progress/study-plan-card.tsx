"use client";

/**
 * Tarjeta compacta "Plan de estudio": semana actual, unidad activa y tarjetas
 * SRS pendientes (TutorContext del runtime), con enlace a /practice.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { TutorContext } from "@/domain/tutor/tutor-context";

export function StudyPlanCard({ runtime }: { runtime: EmmaRuntime }) {
  const [context, setContext] = useState<TutorContext | null>(null);

  useEffect(() => {
    let alive = true;
    runtime
      .tutorContext()
      .then((r) => {
        if (alive) setContext(r.context);
      })
      .catch(() => {
        if (alive) setContext(null);
      });
    return () => {
      alive = false;
    };
  }, [runtime]);

  if (!context) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Study plan</p>
            <p className="text-xs text-muted-foreground">
              Week {context.currentWeek} of the plan
              {context.activeUnit !== null ? ` · Unit ${context.activeUnit}` : ""}
              {` · ${context.pendingSrsCards} cards due`}
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" title="Va a la práctica del día: repaso y ejercicios según tu plan">
          <Link href="/practice">Go to Practice</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
