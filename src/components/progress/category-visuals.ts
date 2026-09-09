/**
 * Color e icono por categoría de escenario.
 *
 * El "why": en el trazado, el color dice DE QUÉ va la escena y la forma dice EN
 * QUÉ PUNTO estás. Separar los dos ejes evita que el color sea decoración: un
 * vistazo basta para ver que la ruta alterna trabajo en equipo, código y
 * ceremonias ágiles, sin leer un solo título.
 *
 * Las clases van escritas enteras porque Tailwind no detecta nombres compuestos
 * en tiempo de ejecución. Los colores son los tokens del tema `cat-1…cat-5`
 * (rediseño «Café sereno», FR-029): variables CSS con variante clara/oscura,
 * así que ya no hacen falta clases `dark:`.
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
    border: "border-cat-1",
    fill: "bg-cat-1 text-white",
    text: "text-cat-1",
    ring: "ring-cat-1/25",
    stroke: "stroke-cat-1/60",
  },
  SOFTWARE_DEVELOPMENT: {
    icon: Code2,
    label: "Desarrollo",
    border: "border-cat-2",
    fill: "bg-cat-2 text-white",
    text: "text-cat-2",
    ring: "ring-cat-2/25",
    stroke: "stroke-cat-2/60",
  },
  AGILE_METHODOLOGIES: {
    icon: Repeat,
    label: "Ceremonias ágiles",
    border: "border-cat-3",
    fill: "bg-cat-3 text-white",
    text: "text-cat-3",
    ring: "ring-cat-3/25",
    stroke: "stroke-cat-3/60",
  },
  DEVOPS: {
    icon: Server,
    label: "Operación",
    border: "border-cat-4",
    fill: "bg-cat-4 text-white",
    text: "text-cat-4",
    ring: "ring-cat-4/25",
    stroke: "stroke-cat-4/60",
  },
  TESTING: {
    icon: Bug,
    label: "Calidad",
    border: "border-cat-5",
    fill: "bg-cat-5 text-white",
    text: "text-cat-5",
    ring: "ring-cat-5/25",
    stroke: "stroke-cat-5/60",
  },
};

const FALLBACK: CategoryVisual = CATEGORY_VISUALS.COLLABORATIVE_WORK;

export function visualFor(category: string | undefined): CategoryVisual {
  return (category && CATEGORY_VISUALS[category]) || FALLBACK;
}
