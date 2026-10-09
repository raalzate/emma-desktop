/**
 * Presets de movimiento compartidos (issue #212). Cada preset tiene su
 * variante `*Reduced`: sin desplazamientos ni giros, solo fundidos. El
 * componente elige el set con `presetsFor(useReducedMotion())`.
 */

import type { Variants } from "motion/react";

const SUAVE = { duration: 0.22, ease: "easeOut" } as const;
const FUNDIDO = { duration: 0.15 } as const;

/** Entrada de tarjeta: sube y se desvanece. */
export const cardEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: SUAVE },
};
export const cardEnterReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: FUNDIDO },
};

/** Transición entre ítems (AnimatePresence con key por ítem). */
export const itemTransition: Variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0, transition: SUAVE },
  exit: { opacity: 0, x: -24, transition: { duration: 0.15 } },
};
export const itemTransitionReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: FUNDIDO },
  exit: { opacity: 0, transition: FUNDIDO },
};

/** Acierto: pop suave de escala. */
export const successPop: Variants = {
  idle: { scale: 1 },
  success: { scale: [1, 1.04, 1], transition: { duration: 0.35, ease: "easeOut" } },
};
export const successPopReduced: Variants = {
  idle: { opacity: 1 },
  success: { opacity: [0.7, 1], transition: FUNDIDO },
};

/** Error: sacudida horizontal que vuelve a 0. */
export const errorShake: Variants = {
  idle: { x: 0 },
  error: { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } },
};
export const errorShakeReduced: Variants = {
  idle: { opacity: 1 },
  error: { opacity: [0.7, 1], transition: FUNDIDO },
};

/** Volteo al revelar: la cara de la respuesta gira de canto (90°) a plana (0°). */
export const flipCard: Variants = {
  hidden: { rotateY: 90, opacity: 0 },
  visible: { rotateY: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};
export const flipCardReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: FUNDIDO },
};

/** Stagger de listas. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: SUAVE },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18 } },
};
export const staggerItemReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: FUNDIDO },
  exit: { opacity: 0, transition: FUNDIDO },
};

export interface MotionPresets {
  cardEnter: Variants;
  itemTransition: Variants;
  successPop: Variants;
  errorShake: Variants;
  flipCard: Variants;
  staggerItem: Variants;
}

const NORMAL: MotionPresets = { cardEnter, itemTransition, successPop, errorShake, flipCard, staggerItem };
const REDUCIDO: MotionPresets = {
  cardEnter: cardEnterReduced,
  itemTransition: itemTransitionReduced,
  successPop: successPopReduced,
  errorShake: errorShakeReduced,
  flipCard: flipCardReduced,
  staggerItem: staggerItemReduced,
};

export function presetsFor(reduced: boolean): MotionPresets {
  return reduced ? REDUCIDO : NORMAL;
}
