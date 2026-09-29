"use client";

/**
 * Tarjeta «Recomendado para hoy» (FR-028): fondo azul suave del tema, tag
 * técnico en font-code y, cuando la vista pasa `onPractice`, el par de CTA
 * (primario para entrar a la escena, secundario con borde hacia el progreso).
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RecommendationReason,
  type NextScenarioRecommendation,
} from "@/domain/pathway/next-scenario-policy";

const REASON_LABEL: Record<string, string> = {
  [RecommendationReason.ERROR_FOCUS]: "Reinforces a recurring error",
  [RecommendationReason.GOAL_MATCH]: "Aligned with your goals",
  [RecommendationReason.CATALOG_ORDER]: "Next on your learning path",
};

export function RecommendedNext({
  recommendation,
  onPractice,
}: {
  recommendation: NextScenarioRecommendation | null;
  /** Si se pasa, la tarjeta muestra los CTA de práctica (contexto: home). */
  onPractice?: (scenarioType: string) => void;
}) {
  if (!recommendation) return null;
  return (
    <section className="rounded-bubble bg-primary-soft p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-code text-[11px] uppercase tracking-widest text-primary">
            Recommended for today
          </p>
          <p className="font-headline text-xl font-bold">{recommendation.title}</p>
          <p className="text-sm text-muted-foreground">{REASON_LABEL[recommendation.reason]}</p>
        </div>
        {onPractice && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" title="Muestra tu ruta de escenas, nivel y métricas">
              <Link href="/progress/">See my progress</Link>
            </Button>
            <Button title="Abre la escena recomendada para hoy" className="gap-2" onClick={() => onPractice(recommendation.scenarioType)}>
              Practice now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
