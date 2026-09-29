/**
 * Mapeo puro de niveles de audio (datos de frecuencia del AnalyserNode) a N
 * barras normalizadas para la onda en vivo. Sin Web Audio API: solo aritmética.
 */

import { describe, it, expect } from "vitest";
import { levelsToBars, idleBars } from "../audio-levels";

describe("levelsToBars", () => {
  it("agrupa los datos de frecuencia en el número de barras pedido", () => {
    const data = [0, 32, 64, 96, 128, 160, 192, 224];
    const bars = levelsToBars(data, 4);
    expect(bars).toHaveLength(4);
  });

  it("normaliza cada barra al rango 0..1", () => {
    const data = [0, 255, 128];
    const bars = levelsToBars(data, 3);
    for (const b of bars) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it("silencio total produce barras en 0", () => {
    const data = new Array(16).fill(0);
    expect(levelsToBars(data, 4)).toEqual([0, 0, 0, 0]);
  });

  it("máxima energía produce barras en 1", () => {
    const data = new Array(16).fill(255);
    expect(levelsToBars(data, 4)).toEqual([1, 1, 1, 1]);
  });

  it("con menos muestras que barras, rellena repitiendo el promedio disponible", () => {
    const bars = levelsToBars([255], 3);
    expect(bars).toEqual([1, 1, 1]);
  });

  it("rechaza un número de barras menor o igual a cero", () => {
    expect(() => levelsToBars([1, 2, 3], 0)).toThrow();
  });
});

describe("idleBars", () => {
  it("devuelve N barras bajas y parejas para el estado sin stream", () => {
    const bars = idleBars(5);
    expect(bars).toHaveLength(5);
    expect(bars.every((b) => b > 0 && b < 0.3)).toBe(true);
  });
});
