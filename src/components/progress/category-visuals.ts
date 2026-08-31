/**
 * Color e icono por categoría de escenario.
 *
 * El "why": en el trazado, el color dice DE QUÉ va la escena y la forma dice EN
 * QUÉ PUNTO estás. Separar los dos ejes evita que el color sea decoración: un
 * vistazo basta para ver que la ruta alterna trabajo en equipo, código y
 * ceremonias ágiles, sin leer un solo título.
 *
 * Las clases van escritas enteras porque Tailwind no detecta nombres compuestos
 * en tiempo de ejecución.
 */

import { Bug, Code2, Repeat, Server, Users, type LucideIcon } from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  /** Nombre en español para la leyenda. */
  label: string;
  /** Borde del nodo (estado pendiente/actual). */
  border: string;
  /** Relleno del nodo superado. */
  fill: string;
  /** Texto e icono sobre fondo claro. */
  text: string;
  /** Halo del nodo actual. */
  ring: string;
  /** Trazo del tramo recorrido. */
  stroke: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  COLLABORATIVE_WORK: {
    icon: Users,
    label: "Trabajo en equipo",
    border: "border-sky-500",
    fill: "bg-sky-500 text-white",
    text: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/25",
    stroke: "stroke-sky-500/60",
  },
  SOFTWARE_DEVELOPMENT: {
    icon: Code2,
    label: "Desarrollo",
    border: "border-violet-500",
    fill: "bg-violet-500 text-white",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/25",
    stroke: "stroke-violet-500/60",
  },
  AGILE_METHODOLOGIES: {
    icon: Repeat,
    label: "Ceremonias ágiles",
    border: "border-amber-500",
    fill: "bg-amber-500 text-white",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/25",
    stroke: "stroke-amber-500/60",
  },
  DEVOPS: {
    icon: Server,
    label: "Operación",
    border: "border-emerald-500",
    fill: "bg-emerald-500 text-white",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/25",
    stroke: "stroke-emerald-500/60",
  },
  TESTING: {
    icon: Bug,
    label: "Calidad",
    border: "border-rose-500",
    fill: "bg-rose-500 text-white",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/25",
    stroke: "stroke-rose-500/60",
  },
};

const FALLBACK: CategoryVisual = CATEGORY_VISUALS.COLLABORATIVE_WORK;

export function visualFor(category: string | undefined): CategoryVisual {
  return (category && CATEGORY_VISUALS[category]) || FALLBACK;
}
