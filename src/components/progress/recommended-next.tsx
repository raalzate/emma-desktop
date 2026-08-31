"use client";

/** Callout del próximo escenario recomendado, con el motivo de la sugerencia. */

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  RecommendationReason,
  type NextScenarioRecommendation,
} from "@/domain/pathway/next-scenario-policy";

const REASON_LABEL: Record<string, string> = {
  [RecommendationReason.ERROR_FOCUS]: "Refuerza un error recurrente",
  [RecommendationReason.GOAL_MATCH]: "Alineado con tus metas",
  [RecommendationReason.CATALOG_ORDER]: "Siguiente en tu ruta de aprendizaje",
};

export function RecommendedNext({
  recommendation,
}: {
  recommendation: NextScenarioRecommendation | null;
}) {
  if (!recommendation) return null;
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex items-start gap-3 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recomendado ahora</p>
          <p className="text-sm font-semibold">{recommendation.title}</p>
          <p className="text-xs text-muted-foreground">{REASON_LABEL[recommendation.reason]}</p>
        </div>
      </CardContent>
    </Card>
  );
}
