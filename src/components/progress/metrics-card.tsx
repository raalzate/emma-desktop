"use client";

/**
 * Tarjeta "Tus métricas": las 3 métricas de progreso (0.6 del libro) que se
 * pueden medir con las sesiones de chat guardadas (latencia, monólogo,
 * densidad de error), con su nivel MCER y una nota de qué mide cada una.
 * Las otras dos métricas del libro (velocidad de lectura, comprensión
 * auditiva) no salen del chat de texto: se autoevalúan manualmente.
 *
 * Rediseño «Café sereno» (FR-027): cifra grande en font-headline y label
 * técnico en font-code, en una tarjeta bg-card con esquinas bubble.
 */

import { useEffect, useState } from "react";
import { Gauge, MessageSquareText, SpellCheck, Timer, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { ProgressCefrLevel } from "@/domain/progression/progress-metrics";
import { metricLevels, type SessionMetrics } from "@/domain/progression/session-metrics";

type SessionAverages = Pick<
  SessionMetrics,
  "responseLatencySeconds" | "longestMonologueWords" | "errorDensityPer100Words"
>;

interface MetricRow {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  level: ProgressCefrLevel;
  note: string;
}

/** Filas a mostrar, a partir del promedio de la tendencia reciente. */
function buildRows(averages: SessionAverages): MetricRow[] {
  const levels = metricLevels({ ...averages, turns: 0, at: 0 });
  return [
    {
      icon: Timer,
      label: "Latencia de respuesta",
      value: averages.responseLatencySeconds.toFixed(1),
      unit: "s",
      level: levels["response-latency"],
      note: "Segundos hasta empezar a responder una pregunta directa. Menos es mejor.",
    },
    {
      icon: MessageSquareText,
      label: "Monólogo sostenido",
      value: `${Math.round(averages.longestMonologueWords)}`,
      unit: "palabras",
      level: levels["sustained-monologue"],
      note: "Palabras del turno más largo del aprendiz (proxy de hablar sin parar).",
    },
    {
      icon: SpellCheck,
      label: "Densidad de error",
      value: averages.errorDensityPer100Words.toFixed(1),
      unit: "/ 100 palabras",
      level: levels["error-density"],
      note: "Errores gramaticales por cada 100 palabras escritas. Menos es mejor.",
    },
  ];
}

/** Vista pura de la tarjeta; se exporta para poder probarla sin runtime. */
export function MetricsCardView({ averages }: { averages: SessionAverages }) {
  const rows = buildRows(averages);
  return (
    <section className="space-y-4 rounded-bubble border border-border bg-card p-5">
      <p className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-muted-foreground">
        <Gauge className="h-3.5 w-3.5" />
        Tus métricas
      </p>
      <ul className="grid gap-5 sm:grid-cols-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.label} className="space-y-1">
              <p className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-accent" />
                {row.label}
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-headline text-3xl font-bold">{row.value}</span>
                <span className="text-sm text-muted-foreground">{row.unit}</span>
                <Badge variant="outline" className="ml-auto">
                  {row.level}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">{row.note}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Las otras dos métricas del libro (velocidad de lectura y comprensión auditiva) no
        se calculan aquí: se autoevalúan manualmente.
      </p>
    </section>
  );
}

export function MetricsCard({ runtime }: { runtime: EmmaRuntime }) {
  const [averages, setAverages] = useState<SessionAverages | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let alive = true;
    runtime
      .metricsTrend()
      .then((trend) => {
        if (!alive) return;
        setAverages(trend.averages);
        setHasData(trend.entries.length > 0);
      })
      .catch(() => {
        if (alive) setAverages(null);
      });
    return () => {
      alive = false;
    };
  }, [runtime]);

  if (!averages || !hasData) return null;
  return <MetricsCardView averages={averages} />;
}
