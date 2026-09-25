"use client";

/**
 * Panel «Hoy» de la ruta Práctica: el plan del día en el orden del método
 * (repaso vencido → ejercicios de la unidad activa → siguiente reto → sonidos).
 * Cada paso es un botón que abre la pestaña correspondiente. El orden lo
 * decide el dominio (`buildPracticeToday`); acá sólo se pinta.
 */

import { ArrowRight, Ear, ListChecks, Repeat, Trophy } from "lucide-react";
import type { PracticeStep, PracticeTab, PracticeToday as PracticePlan } from "@/domain/practice/practice-today";

const ICONS: Record<PracticeTab, typeof Repeat> = {
  srs: Repeat,
  exercises: ListChecks,
  challenges: Trophy,
  pronunciation: Ear,
};

interface Props {
  plan: PracticePlan | null;
  onPick: (step: PracticeStep) => void;
}

export function PracticeToday({ plan, onPick }: Props) {
  if (!plan) {
    return <div className="h-24 animate-pulse rounded-bubble bg-secondary/60" aria-hidden />;
  }

  return (
    <section className="space-y-3 rounded-bubble border border-border bg-card p-4">
      <div>
        <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">Hoy</p>
        <h2 className="font-headline text-base font-semibold">{plan.headlineEs}</h2>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {plan.steps.map((step, i) => {
          const Icon = ICONS[step.tab];
          return (
            <li key={`${step.tab}-${i}`}>
              <button
                type="button"
                onClick={() => onPick(step)}
                className="flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="font-code text-[11px] text-muted-foreground">{i + 1}</span>
                    {step.titleEs}
                    {step.count !== undefined && (
                      <span className="rounded-full bg-accent-soft px-2 font-code text-[11px] text-accent">
                        {step.count}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{step.detailEs}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
