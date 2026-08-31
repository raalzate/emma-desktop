"use client";

/**
 * Autoevaluación A1→B2 (Apéndice H): checklists persistidos con
 * ISelfAssessmentRepository, barra de progreso por nivel y banner de
 * certificación B2 cuando se cumple la regla (bases 100% + ≥13/15 de B2).
 */

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import {
  SELF_ASSESSMENT_CHECKLISTS,
  certifiesB2,
  checklistProgress,
  type CefrCheckLevel,
} from "@/domain/curriculum/self-assessment";

const LEVELS: readonly CefrCheckLevel[] = ["A1", "A2", "B1", "B2"];

interface Props {
  runtime: EmmaRuntime;
  /** Nivel a resaltar desde una recomendación de Emma (deep-link ?level=). */
  initialLevel?: string;
}

export function SelfAssessmentView({ runtime, initialLevel }: Props) {
  const [checked, setChecked] = useState<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ids = await runtime.repos.selfAssessment.loadChecked();
      if (!alive) return;
      setChecked(new Set(ids));
    })();
    return () => {
      alive = false;
    };
  }, [runtime]);

  if (checked === null) {
    return <p className="text-sm text-muted-foreground">Cargando autoevaluación…</p>;
  }

  async function toggle(id: string, value: boolean) {
    const next = new Set(checked);
    if (value) next.add(id);
    else next.delete(id);
    setChecked(next);
    await runtime.repos.selfAssessment.saveChecked([...next]);
  }

  const certified = certifiesB2(checked);

  return (
    <div className="space-y-6">
      {certified && (
        <div className="rounded-md border border-green-600 bg-green-50 p-3 text-sm text-green-800">
          Certificas B2: ≥13/15 de B2 y 100% de A1–B1.
        </div>
      )}

      {LEVELS.map((level) => {
        const progress = checklistProgress(level, checked);
        const items = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === level);
        const highlighted = level === initialLevel;
        return (
          <section
            key={level}
            className={`space-y-2 ${highlighted ? "rounded-md border border-primary p-2" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{level}</h3>
              <span className="text-xs text-muted-foreground">
                {progress.done}/{progress.total}
              </span>
            </div>
            <Progress value={(progress.done / progress.total) * 100} />
            <ul className="space-y-2">
              {items.map((d) => (
                <li key={d.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={checked.has(d.id)}
                    onCheckedChange={(v) => toggle(d.id, v === true)}
                    id={d.id}
                  />
                  <label htmlFor={d.id}>{d.text}</label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
