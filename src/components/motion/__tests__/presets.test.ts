/**
 * Presets de movimiento: con reduced motion no hay desplazamientos ni giros,
 * solo fundidos; el volteo de tarjeta gira en rotateY.
 */

import { describe, expect, it } from "vitest";
import {
  cardEnter,
  cardEnterReduced,
  errorShake,
  errorShakeReduced,
  flipCard,
  flipCardReduced,
  itemTransition,
  itemTransitionReduced,
  staggerContainer,
  staggerItem,
  staggerItemReduced,
  successPop,
  successPopReduced,
  presetsFor,
} from "@/components/motion/presets";

const TRANSFORM_KEYS = ["x", "y", "scale", "rotate", "rotateX", "rotateY"];

type Estados = Record<string, unknown>;

function clavesDe(v: Estados): string[] {
  return Object.values(v).flatMap((estado) =>
    estado && typeof estado === "object" ? Object.keys(estado) : [],
  );
}

describe("presets de movimiento", () => {
  it("las variantes reducidas solo animan opacidad", () => {
    const reducidas = [
      cardEnterReduced,
      errorShakeReduced,
      successPopReduced,
      itemTransitionReduced,
      staggerItemReduced,
      flipCardReduced,
    ];
    for (const v of reducidas) {
      expect(clavesDe(v as Estados).filter((k) => TRANSFORM_KEYS.includes(k))).toEqual([]);
    }
  });

  it("el volteo de tarjeta gira en rotateY", () => {
    expect(flipCard.hidden).toHaveProperty("rotateY");
    expect(flipCard.visible).toHaveProperty("rotateY");
  });

  it("el error sacude en horizontal y el acierto escala suave", () => {
    const sacudida = (errorShake.error as { x: number[] }).x;
    expect(sacudida.length).toBeGreaterThan(2);
    expect(sacudida[sacudida.length - 1]).toBe(0);
    const pop = (successPop.success as { scale: number[] }).scale;
    expect(Math.max(...pop)).toBeLessThanOrEqual(1.1);
    expect(pop[pop.length - 1]).toBe(1);
  });

  it("la entrada y la transición entre ítems desplazan en modo normal", () => {
    expect(cardEnter.hidden).toHaveProperty("y");
    expect(itemTransition.enter).toHaveProperty("x");
    expect(itemTransition.exit).toHaveProperty("x");
  });

  it("el stagger escalona a los hijos", () => {
    const visible = staggerContainer.visible as { transition: { staggerChildren: number } };
    expect(visible.transition.staggerChildren).toBeGreaterThan(0);
    expect(staggerItem.hidden).toHaveProperty("y");
  });

  it("presetsFor elige el set reducido o el normal", () => {
    expect(presetsFor(true).cardEnter).toBe(cardEnterReduced);
    expect(presetsFor(false).cardEnter).toBe(cardEnter);
  });
});
