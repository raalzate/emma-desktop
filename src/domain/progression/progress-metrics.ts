/**
 * Métricas de progreso (0.6 del libro): "siento que estoy mejorando" no es un
 * dato. Estas cinco métricas se miden una vez al mes y se comparan contra
 * umbrales por nivel MCER. En latencia y densidad de error, un valor MENOR es
 * mejor (orientation "lower-is-better"); en las demás, mayor es mejor.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export type ProgressCefrLevel = Extract<CefrLevel, "A1" | "A2" | "B1" | "B2">;

type Orientation = "higher-is-better" | "lower-is-better";

export interface ProgressMetric {
  readonly id: string;
  readonly name: string;
  readonly how: string;
  readonly orientation: Orientation;
  /** Descripción del rango de cada nivel, transcrita de la tabla del libro. */
  readonly thresholds: Record<ProgressCefrLevel, string>;
  /** Puntos de corte internos entre A1/A2, A2/B1 y B1/B2, en la dirección natural de la métrica. */
  readonly breakpoints: readonly [number, number, number];
}

export const PROGRESS_METRICS: readonly ProgressMetric[] = [
  {
    id: "reading-speed",
    name: "Technical reading speed",
    how: "words/min in real documentation, with comprehension",
    orientation: "higher-is-better",
    thresholds: { A1: "<80", A2: "80-120", B1: "120-180", B2: "180-250" },
    breakpoints: [80, 120, 180],
  },
  {
    id: "response-latency",
    name: "Response latency",
    how: "seconds before you start answering a direct question",
    orientation: "lower-is-better",
    thresholds: { A1: ">8", A2: "5-8", B1: "2-4", B2: "<2" },
    breakpoints: [8, 4, 2],
  },
  {
    id: "error-density",
    name: "Error density",
    how: "grammar errors per 100 written words",
    orientation: "lower-is-better",
    thresholds: { A1: ">15", A2: "10-15", B1: "5-10", B2: "<5" },
    breakpoints: [15, 10, 5],
  },
  {
    id: "sustained-monologue",
    name: "Sustained monologue",
    how: "minutes talking about a technical topic without stopping",
    orientation: "higher-is-better",
    thresholds: { A1: "<1", A2: "1-2", B1: "3-4", B2: "5+" },
    breakpoints: [1, 3, 5],
  },
  {
    id: "listening-comprehension",
    name: "Native audio comprehension",
    how: "% of a technical video understood without subtitles",
    orientation: "higher-is-better",
    thresholds: { A1: "<30%", A2: "30-50%", B1: "50-75%", B2: "75-90%" },
    breakpoints: [30, 50, 75],
  },
] as const;

/** value crece con el nivel: <t1 → A1, <t2 → A2, <t3 → B1, resto → B2. */
function classifyAscending(
  value: number,
  [t1, t2, t3]: readonly [number, number, number],
): ProgressCefrLevel {
  if (value < t1) return "A1";
  if (value < t2) return "A2";
  if (value < t3) return "B1";
  return "B2";
}

/** value decrece con el nivel (menor es mejor): >t1 → A1, >t2 → A2, >=t3 → B1, resto → B2. */
function classifyDescending(
  value: number,
  [t1, t2, t3]: readonly [number, number, number],
): ProgressCefrLevel {
  if (value > t1) return "A1";
  if (value > t2) return "A2";
  if (value >= t3) return "B1";
  return "B2";
}

/** Nivel MCER correspondiente a un valor medido de la métrica *metricId*. */
export function levelForMetric(metricId: string, value: number): ProgressCefrLevel {
  const metric = PROGRESS_METRICS.find((m) => m.id === metricId);
  if (!metric) throw new Error(`progress metric "${metricId}" does not exist`);

  return metric.orientation === "higher-is-better"
    ? classifyAscending(value, metric.breakpoints)
    : classifyDescending(value, metric.breakpoints);
}
