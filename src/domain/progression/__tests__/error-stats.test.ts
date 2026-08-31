import { describe, it, expect } from "vitest";
import { createErrorStat, statsFromErrors, recurringCategory } from "../error-stats";
import type { SilentError } from "@/domain/chat/silent-error";
import type { ErrorLabel } from "@/domain/chat/error-taxonomy";

function err(label: ErrorLabel): SilentError {
  return { label, original: "x", corrected: "y" };
}

describe("createErrorStat", () => {
  it("construye un stat con conteo positivo", () => {
    expect(createErrorStat("article", 2)).toEqual({ errorType: "article", count: 2 });
  });

  it("lanza error cuando el conteo es cero", () => {
    expect(() => createErrorStat("article", 0)).toThrow("count must be positive");
  });

  it("lanza error cuando el conteo es negativo", () => {
    expect(() => createErrorStat("article", -1)).toThrow("count must be positive");
  });
});

describe("statsFromErrors", () => {
  it("colapsa errores en conteos por categoría", () => {
    const stats = statsFromErrors([err("article"), err("article"), err("preposition")]);
    expect(stats).toEqual([
      { errorType: "article", count: 2 },
      { errorType: "preposition", count: 1 },
    ]);
  });

  it("ordena las categorías alfabéticamente", () => {
    const stats = statsFromErrors([err("preposition"), err("article"), err("grammar")]);
    expect(stats.map((s) => s.errorType)).toEqual(["article", "grammar", "preposition"]);
  });

  it("devuelve lista vacía cuando no hay errores", () => {
    expect(statsFromErrors([])).toEqual([]);
  });
});

describe("recurringCategory", () => {
  it("devuelve la categoría más frecuente cuando alcanza el mínimo", () => {
    const stats = [
      { errorType: "article", count: 3 },
      { errorType: "preposition", count: 1 },
    ];
    expect(recurringCategory(stats)).toBe("article");
  });

  it("devuelve null cuando la más frecuente no alcanza el mínimo", () => {
    const stats = [
      { errorType: "article", count: 2 }, // 2 < DEFAULT_MIN_TOTAL (3)
      { errorType: "preposition", count: 1 },
    ];
    expect(recurringCategory(stats)).toBeNull();
  });

  it("devuelve null cuando no hay stats", () => {
    expect(recurringCategory([])).toBeNull();
  });

  it("suma conteos de la misma categoría antes de comparar", () => {
    const stats = [
      { errorType: "article", count: 2 },
      { errorType: "article", count: 1 }, // total 3 >= 3
    ];
    expect(recurringCategory(stats)).toBe("article");
  });

  it("resuelve empates por orden alfabético", () => {
    const stats = [
      { errorType: "preposition", count: 3 },
      { errorType: "article", count: 3 },
    ];
    expect(recurringCategory(stats)).toBe("article");
  });

  it("respeta un mínimo personalizado", () => {
    const stats = [{ errorType: "article", count: 2 }];
    expect(recurringCategory(stats, 2)).toBe("article");
    expect(recurringCategory(stats, 3)).toBeNull();
  });
});
