import { describe, it, expect } from "vitest";
import { PROGRESS_METRICS, levelForMetric } from "../progress-metrics";

describe("PROGRESS_METRICS", () => {
  it("define las cinco métricas del 0.6 con umbrales para los cuatro niveles", () => {
    const ids = PROGRESS_METRICS.map((m) => m.id);
    expect(ids).toEqual([
      "reading-speed",
      "response-latency",
      "error-density",
      "sustained-monologue",
      "listening-comprehension",
    ]);
    for (const metric of PROGRESS_METRICS) {
      expect(Object.keys(metric.thresholds)).toEqual(["A1", "A2", "B1", "B2"]);
    }
  });
});

describe("levelForMetric — velocidad de lectura (mayor es mejor)", () => {
  it("clasifica por rangos de palabras/min", () => {
    expect(levelForMetric("reading-speed", 50)).toBe("A1"); // <80
    expect(levelForMetric("reading-speed", 100)).toBe("A2"); // 80-120
    expect(levelForMetric("reading-speed", 150)).toBe("B1"); // 120-180
    expect(levelForMetric("reading-speed", 200)).toBe("B2"); // 180-250
    expect(levelForMetric("reading-speed", 300)).toBe("B2"); // por encima del rango B2 sigue siendo B2
  });
});

describe("levelForMetric — latencia de respuesta (menor es mejor)", () => {
  it("clasifica por segundos, invirtiendo la dirección", () => {
    expect(levelForMetric("response-latency", 10)).toBe("A1"); // >8
    expect(levelForMetric("response-latency", 6)).toBe("A2"); // 5-8
    expect(levelForMetric("response-latency", 3)).toBe("B1"); // 2-4
    expect(levelForMetric("response-latency", 1)).toBe("B2"); // <2
  });
});

describe("levelForMetric — densidad de error (menor es mejor)", () => {
  it("clasifica por errores cada 100 palabras", () => {
    expect(levelForMetric("error-density", 20)).toBe("A1"); // >15
    expect(levelForMetric("error-density", 12)).toBe("A2"); // 10-15
    expect(levelForMetric("error-density", 7)).toBe("B1"); // 5-10
    expect(levelForMetric("error-density", 2)).toBe("B2"); // <5
  });
});

describe("levelForMetric — monólogo sostenido (mayor es mejor)", () => {
  it("clasifica por minutos hablando sin parar", () => {
    expect(levelForMetric("sustained-monologue", 0.5)).toBe("A1"); // <1
    expect(levelForMetric("sustained-monologue", 1.5)).toBe("A2"); // 1-2
    expect(levelForMetric("sustained-monologue", 3.5)).toBe("B1"); // 3-4
    expect(levelForMetric("sustained-monologue", 6)).toBe("B2"); // 5+
  });
});

describe("levelForMetric — comprensión de audio nativo (mayor es mejor)", () => {
  it("clasifica por porcentaje entendido sin subtítulos", () => {
    expect(levelForMetric("listening-comprehension", 20)).toBe("A1"); // <30%
    expect(levelForMetric("listening-comprehension", 40)).toBe("A2"); // 30-50%
    expect(levelForMetric("listening-comprehension", 60)).toBe("B1"); // 50-75%
    expect(levelForMetric("listening-comprehension", 80)).toBe("B2"); // 75-90%
  });
});

describe("levelForMetric — errores de entrada", () => {
  it("lanza si el id de la métrica no existe", () => {
    expect(() => levelForMetric("unknown-metric", 1)).toThrow(/no existe/);
  });
});
