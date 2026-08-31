"use client";

/** Barra de avance (superados/total) + explicación de la barra de aprobación y racha. */

import { Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { pathwayPassedCount, pathwayTotal, type Pathway } from "@/domain/pathway/pathway";
import { passBar, PROMOTION_STREAK } from "@/domain/progression/promotion-policy";

export function PathwayProgress({ pathway, level }: { pathway: Pathway; level: string }) {
  const passed = pathwayPassedCount(pathway);
  const total = pathwayTotal(pathway);
  const pct = total ? Math.round((passed / total) * 100) : 0;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Escenarios superados</span>
        <span className="text-muted-foreground">
          {passed}/{total}
        </span>
      </div>
      <Progress value={pct} />
      <PassBarHint level={level} />
    </section>
  );
}

/** Recuerda al aprendiz cuánta precisión y cuántos aprobados exige promover. */
function PassBarHint({ level }: { level: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Apruebas un escenario con ≤ {passBar(level)} errores por turno; {PROMOTION_STREAK} aprobados
        seguidos te promueven al siguiente nivel.
      </span>
    </p>
  );
}
