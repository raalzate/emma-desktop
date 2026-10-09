"use client";

/**
 * Punto único de movimiento para los componentes: las prácticas importan de
 * `@/components/motion` y nunca de `motion/react` (lo vigila un test). Cada
 * envoltorio elige su preset normal o reducido según `prefers-reduced-motion`.
 */

import type { ElementType, ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { presetsFor, staggerContainer, type MotionPresets } from "./presets";

export * from "./presets";

function usePresets(): MotionPresets {
  return presetsFor(useReducedMotion() ?? false);
}

interface BoxProps {
  children: ReactNode;
  className?: string;
}

/** Raíz del renderer: respeta la preferencia del sistema (sin transformaciones, solo fundidos). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Entrada de tarjeta o de página. */
export function CardEnter({ children, className }: BoxProps) {
  const { cardEnter } = usePresets();
  return (
    <motion.div className={className} variants={cardEnter} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

/** Paso entre ítems: al cambiar `itemKey` sale el anterior y entra el nuevo. */
export function ItemTransition({ itemKey, children, className }: BoxProps & { itemKey: string | number }) {
  const { itemTransition } = usePresets();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={itemKey}
        className={className}
        variants={itemTransition}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export type FeedbackState = "idle" | "success" | "error";

/** Acierto (pop) o error (sacudida) sobre su contenido; `idle` no anima. */
export function AnswerFeedback({ state, children, className }: BoxProps & { state: FeedbackState }) {
  const { successPop, errorShake } = usePresets();
  const variants = state === "error" ? errorShake : successPop;
  return (
    <motion.div className={className} variants={variants} initial="idle" animate={state}>
      {children}
    </motion.div>
  );
}

/** Revela contenido volteándolo en rotateY (respuesta de una tarjeta). */
export function FlipReveal({ children, className }: BoxProps) {
  const { flipCard } = usePresets();
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 800 }}
      variants={flipCard}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends BoxProps {
  /** Etiqueta de la lista (`ul`, `ol` o `div`). */
  as?: "ul" | "ol" | "div";
}

const LISTAS: Record<NonNullable<StaggerProps["as"]>, ElementType> = {
  ul: motion.ul,
  ol: motion.ol,
  div: motion.div,
};

/** Contenedor que escalona la entrada de sus `StaggerItem`. */
export function Stagger({ as = "div", children, className }: StaggerProps) {
  const Tag = LISTAS[as];
  return (
    <Tag className={className} variants={staggerContainer} initial="hidden" animate="visible">
      {children}
    </Tag>
  );
}

/** Hijo de `Stagger`; `exit` aplica al salir dentro de un `AnimatePresence`. */
export function StaggerItem({ children, className, as = "div" }: BoxProps & { as?: "li" | "div" }) {
  const { staggerItem } = usePresets();
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag className={className} variants={staggerItem} exit="exit" layout="position">
      {children}
    </Tag>
  );
}

/** Para listas con salida (completar/quitar ítems). */
export function PresenceList({ children }: { children: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}
