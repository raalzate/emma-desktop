"use client";

/**
 * Tarjeta "Tus métricas": las 3 métricas de progreso (0.6 del libro) que se
 * pueden medir con las sesiones de chat guardadas (latencia, monólogo,
 * densidad de error), con su nivel MCER y una nota de qué mide cada una.
 * Las otras dos métricas del libro (velocidad de lectura, comprensión
 * auditiva) no salen del chat de texto: se autoevalúan manualmente.
 */

import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { ProgressCefrLevel } from "@/domain/progression/progress-metrics";
import { metricLevels, type SessionMetrics } from "@/domain/progression/session-metrics";

type SessionAverages = Pick<
  SessionMetrics,
  "responseLatencySeconds" | "longestMonologueWords" | "errorDensityPer100Words"
>;

interface MetricRow {
  label: string;
  value: string;
  level: ProgressCefrLevel;
  note: string;
}

/** Filas a mostrar, a partir del promedio de la tendencia reciente. */
function buildRows(averages: SessionAverages): MetricRow[] {
  const levels = metricLevels({ ...averages, turns: 0, at: 0 });
  return [
    {
      label: "Latencia de respuesta",
      value: `${averages.responseLatencySeconds.toFixed(1)} s`,
      level: levels["response-latency"],
      note: "Segundos hasta empezar a responder una pregunta directa. Menos es mejor.",
    },
    {
      label: "Monólogo sostenido",
      value: `${Math.round(averages.longestMonologueWords)} palabras`,
      level: levels["sustained-monologue"],
      note: "Palabras del turno más largo del aprendiz (proxy de hablar sin parar).",
    },
    {
      label: "Densidad de error",
      value: `${averages.errorDensityPer100Words.toFixed(1)} / 100 palabras`,
      level: levels["error-density"],
      note: "Errores gramaticales por cada 100 palabras escritas. Menos es mejor.",
    },
  ];
}

export function MetricsCard({ runtime }: { runtime: EmmaRuntime }) {
  const [averages, setAverages] = useState<Pick<
    SessionMetrics,
    "responseLatencySeconds" | "longestMonologueWords" | "errorDensityPer100Words"
  > | null>(null);
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
  const rows = buildRows(averages);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold">Tus métricas</p>
        </div>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.note}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">{row.value}</span>
                <Badge variant="outline">{row.level}</Badge>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Las otras dos métricas del libro (velocidad de lectura y comprensión auditiva) no
          se calculan aquí: se autoevalúan manualmente.
        </p>
      </CardContent>
    </Card>
  );
}
