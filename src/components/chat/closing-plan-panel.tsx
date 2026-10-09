"use client";

/**
 * Cierre de la simulación (#211), presentacional: con lecciones asignadas una
 * sola acción lleva a «My lessons»; sin correcciones se le pregunta al aprendiz
 * si practica la escena otra vez o continúa. La decisión vive en el dominio
 * (`closingPlanFor`); aquí sólo se pinta.
 */

import { ArrowRight, BookOpenCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClosingPlan } from "@/domain/lessons/closing-plan";

interface Props {
  plan: ClosingPlan | null;
  onStartLessons: () => void;
  onPracticeAgain: () => void;
  onContinue: () => void;
}

export function ClosingPlanPanel({ plan, onStartLessons, onPracticeAgain, onContinue }: Props) {
  if (!plan) return null;

  if (plan.kind === "choice") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">
          Great work — nothing to fix this time. Practice this scene again or continue?
        </p>
        <div className="flex flex-wrap gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="gap-1"
            title="Repite esta misma escena para afianzar lo que acabas de aprender"
            onClick={onPracticeAgain}
          >
            <RotateCcw className="h-4 w-4" /> Practice again
          </Button>
          <Button className="gap-1" title="Avanza a la siguiente escena de tu ruta" onClick={onContinue}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lessons assigned for you
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          {plan.drafts.map((d) => (
            <li key={`${d.kind}:${d.target}`} title={d.reasonEs}>
              {d.titleEs}
            </li>
          ))}
        </ul>
      </div>
      <Button
        className="w-full gap-1"
        title="Abre Mis lecciones para empezar lo que Emma te asignó"
        onClick={onStartLessons}
      >
        <BookOpenCheck className="h-4 w-4" /> Start my lessons
      </Button>
    </div>
  );
}
