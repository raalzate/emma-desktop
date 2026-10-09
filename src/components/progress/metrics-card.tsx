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
import { levelLabel } from "@/domain/cefr/cefr-ladder";
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
      label: "Response latency",
      value: averages.responseLatencySeconds.toFixed(1),
      unit: "s",
      level: levels["response-latency"],
      note: "Seconds before you start answering a direct question. Lower is better.",
    },
    {
      icon: MessageSquareText,
      label: "Sustained monologue",
      value: `${Math.round(averages.longestMonologueWords)}`,
      unit: "words",
      level: levels["sustained-monologue"],
      note: "Words in your longest turn (a proxy for speaking without stopping).",
    },
    {
      icon: SpellCheck,
      label: "Error density",
      value: averages.errorDensityPer100Words.toFixed(1),
      unit: "/ 100 words",
      level: levels["error-density"],
      note: "Grammar errors per 100 written words. Lower is better.",
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
        Your metrics
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
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline text-3xl font-bold">{row.value}</span>
                <span className="text-sm text-muted-foreground">{row.unit}</span>
                <Badge variant="outline" className="ml-auto">
                  {levelLabel(row.level)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{row.note}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        The other two metrics of the method (reading speed and listening comprehension) are
        not tracked here.
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
