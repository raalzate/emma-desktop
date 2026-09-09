"use client";

/**
 * La ruta del nivel como un trazado de nodos, no como una parrilla de tarjetas.
 *
 * El "why" del lenguaje visual: la mecánica de "camino con nodos" hace legible
 * de un vistazo dónde estás y qué sigue, pero el método del libro rechaza la
 * gamificación (§0.2: motivación interna, resultados medibles — sin premios).
 * El rediseño «Café sereno» (FR-026) lo cuenta con 4 estados: completada
 * (círculo primary + check), en curso (accent con halo), siguiente (contorno)
 * y bloqueada (apagada con candado); los conectores van sólidos hacia nodos
 * alcanzables y punteados hacia los bloqueados.
 *
 * Dos ejes independientes: el COLOR y el ICONO dicen de qué va la escena
 * (categoría); la FORMA dice en qué punto estás (estado del nodo).
 */

import { Check, Lock, Play } from "lucide-react";
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

type NodeState = "completed" | "current" | "next" | "locked";

/**
 * Estado de cada nodo: superadas → completada; la recomendada → en curso; la
 * primera pendiente restante → siguiente; el resto → bloqueada (solo visual:
 * cualquier escena sigue siendo clicable, el orden es una sugerencia).
 */
function trailStates(items: PathwayItem[], recommendedType?: string | null): NodeState[] {
  let nextTaken = false;
  return items.map((item) => {
    if (isPathwayItemPassed(item)) return "completed";
    if (item.scenarioType === recommendedType) return "current";
    if (!nextTaken) {
      nextTaken = true;
      return "next";
    }
    return "locked";
  });
}

const STATE_LABEL: Record<NodeState, string> = {
  completed: "Completada",
  current: "En curso",
  next: "Siguiente",
  locked: "Bloqueada",
};

/** Forma del nodo según su estado (el color de categoría solo tiñe «siguiente»). */
function shapeClass(state: NodeState, categoryText: string): string {
  return cn(
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
    state === "completed" && "border-primary bg-primary text-primary-foreground",
    state === "current" && "border-accent bg-accent text-accent-foreground ring-4 ring-accent-soft",
    state === "next" && cn("border-border bg-card", categoryText),
    state === "locked" && "border-transparent bg-secondary text-muted-foreground",
  );
}

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
  const states = trailStates(items, recommendedType);
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
            // Sólido hacia nodos alcanzables; punteado solo hacia bloqueados (FR-026).
            const toLocked = states[i + 1] === "locked";
            const walked = states[i + 1] === "completed" || states[i + 1] === "current";
            return (
              <path
                key={item.scenarioType}
                d={segmentPath(i, i + 1)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={toLocked ? "2 6" : undefined}
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
              {state === "completed" && <Check className="h-5 w-5" />}
              {state === "current" && <Play className="h-5 w-5" />}
              {state === "next" && <Icon className="h-5 w-5" />}
              {state === "locked" && <Lock className="h-4 w-4" />}
              <span className="sr-only">
                {item.title} — {visual.label} — {STATE_LABEL[state]}
              </span>
            </>
          );
          const shape = shapeClass(state, visual.text);
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
                    state === "locked" && "text-muted-foreground",
                  )}
                  title={item.title}
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    "block font-code text-[10px] uppercase tracking-wide",
                    state === "current" ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {STATE_LABEL[state]}
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
