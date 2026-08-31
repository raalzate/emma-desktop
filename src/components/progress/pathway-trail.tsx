"use client";

/**
 * La ruta del nivel como un trazado de nodos, no como una parrilla de tarjetas.
 *
 * El "why" del lenguaje visual: la mecánica de "camino con nodos" hace legible
 * de un vistazo dónde estás y qué sigue, pero el método del libro rechaza la
 * gamificación (§0.2: motivación interna, resultados medibles — sin premios).
 * Así que el camino no se dibuja como un juego sino como lo que un ingeniero ya
 * sabe leer: un grafo de ramas, con la escena actual marcada `HEAD`, el tramo
 * recorrido en línea sólida y lo pendiente en línea punteada.
 *
 * Dos ejes independientes: el COLOR y el ICONO dicen de qué va la escena
 * (categoría); la FORMA dice en qué punto estás (superado / actual / pendiente).
 */

import { Check } from "lucide-react";
import { isPathwayItemPassed, type PathwayItem } from "@/domain/pathway/pathway-item";
import type { Pathway } from "@/domain/pathway/pathway";
import { getScenario } from "@/domain/scenarios/scenario-catalog";
import { cn } from "@/lib/utils";
import { CATEGORY_VISUALS, visualFor } from "./category-visuals";

// Geometría del trazado. La X va en porcentaje del ancho (el SVG se estira con
// preserveAspectRatio="none"), así los nodos y la línea coinciden a cualquier tamaño.
const STEP_Y = 92;
const TOP_PAD = 32;
const CENTER_X = 50;
const SERPENTINE = [0, 13, 19, 13, 0, -13, -19, -13];

function xAt(index: number): number {
  return CENTER_X + SERPENTINE[index % SERPENTINE.length];
}

function yAt(index: number): number {
  return TOP_PAD + index * STEP_Y;
}

/** Curva en S entre nodos consecutivos: control vertical a media altura. */
function segmentPath(from: number, to: number): string {
  const [x1, y1, x2, y2] = [xAt(from), yAt(from), xAt(to), yAt(to)];
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

type NodeState = "passed" | "current" | "pending";

function stateOf(item: PathwayItem, recommendedType?: string | null): NodeState {
  if (isPathwayItemPassed(item)) return "passed";
  return item.scenarioType === recommendedType ? "current" : "pending";
}

const STATE_LABEL: Record<NodeState, string> = {
  passed: "Superado",
  current: "Siguiente",
  pending: "Pendiente",
};

export function PathwayTrail({
  pathway,
  recommendedType,
  onSelect,
}: {
  pathway: Pathway;
  recommendedType?: string | null;
  /** Si se pasa, cada nodo entra a esa escena; si no, el trazado es solo lectura. */
  onSelect?: (scenarioType: string) => void;
}) {
  const items = pathway.items;
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Este nivel aún no tiene escenarios.</p>;
  }
  const height = yAt(items.length - 1) + TOP_PAD;
  const states = items.map((item) => stateOf(item, recommendedType));
  const visuals = items.map((item) => visualFor(getScenario(item.scenarioType)?.category));
  // Solo se listan en la leyenda las categorías que aparecen en este nivel.
  const legend = Object.entries(CATEGORY_VISUALS).filter(([key]) =>
    items.some((i) => getScenario(i.scenarioType)?.category === key),
  );

  return (
    <div className="space-y-6">
      <div className="relative mx-auto w-full max-w-md" style={{ height }}>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {items.slice(0, -1).map((item, i) => {
            // El tramo se dibuja "recorrido" mientras el nodo de origen esté superado.
            const walked = states[i] === "passed";
            return (
              <path
                key={item.scenarioType}
                d={segmentPath(i, i + 1)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={walked ? undefined : "2 6"}
                className={walked ? visuals[i].stroke : "stroke-border"}
              />
            );
          })}
        </svg>

        {items.map((item, i) => {
          const state = states[i];
          const visual = visuals[i];
          const Icon = visual.icon;
          const labelLeft = xAt(i) > CENTER_X;
          const face = (
            <>
              {state === "passed" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              <span className="sr-only">
                {item.title} — {visual.label} — {STATE_LABEL[state]}
              </span>
            </>
          );
          const shape = cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-background",
            state === "passed" && cn(visual.border, visual.fill),
            state === "current" && cn(visual.border, visual.text, "ring-4", visual.ring, "motion-safe:animate-pulse"),
            state === "pending" && cn("border-dashed border-border", visual.text, "opacity-60"),
          );
          return (
            <div
              key={item.scenarioType}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-3"
              style={{ left: `${xAt(i)}%`, top: yAt(i), flexDirection: labelLeft ? "row-reverse" : "row" }}
            >
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(item.scenarioType)}
                  className={cn(
                    shape,
                    "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  {face}
                </button>
              ) : (
                <span className={shape}>{face}</span>
              )}
              <span className={cn("w-36 leading-tight", labelLeft ? "text-right" : "text-left")}>
                <span
                  className={cn(
                    "block truncate text-xs font-medium",
                    state === "pending" && "text-muted-foreground",
                  )}
                  title={item.title}
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    "block font-mono text-[10px] uppercase tracking-wide",
                    state === "current" ? visual.text : "text-muted-foreground",
                  )}
                >
                  {state === "current" ? "HEAD · siguiente" : STATE_LABEL[state]}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Tipos de escena">
        {legend.map(([key, visual]) => {
          const Icon = visual.icon;
          return (
            <li key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Icon className={cn("h-3.5 w-3.5", visual.text)} />
              {visual.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
