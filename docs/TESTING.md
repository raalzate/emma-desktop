# Estrategia de pruebas y TDD — EMMA Desktop

Runner: **Vitest**. Cobertura sobre `src/domain/`, `src/application/` y
`src/lib/` (config en `vitest.config.ts`).

## Ciclo TDD (obligatorio para domain/application)

**Red → Green → Refactor.** Nunca escribas código de producción sin una prueba
que falle primero.

1. **Red** — escribe la prueba más pequeña que exprese el siguiente
   comportamiento. Corre `pnpm test:watch`; debe fallar por la razón correcta.
2. **Green** — el mínimo código para que pase. Nada de más.
3. **Refactor** — limpia (guard clauses, extracción de helpers, nombres) con las
   pruebas en verde. Repite.

## Qué probar y cómo

| Capa | Qué probar | Estrategia |
|---|---|---|
| domain | reglas puras, parsers, políticas | entrada→salida directa, sin mocks |
| application | orquestación de casos de uso | inyecta **puertos falsos** (fakes) por argumento |
| src/lib/ai | routing, adaptadores | fakes de proveedor; sin red real |

- **Inyecta puertos falsos**, no mockees imports. Como los casos de uso reciben
  `LlmGenerate` por argumento, pasa una función fake que devuelve un texto fijo.
- Prueba **caminos felices y de error** (p. ej. `teach` devuelve `errorResult`
  cuando una sección falla).
- **Determinismo:** si el código usa tiempo/aleatoriedad, inyéctalo para poder
  aserverar; no dependas de `Date.now()` real en asserts.

## Convenciones de prueba

- Ubicación: `__tests__/nombre.test.ts` junto al módulo.
- `describe` = unidad; `it("<comportamiento en español>")`.
- Un comportamiento por `it`; nombres que describen la regla, no la implementación.
- Comentario inline con el cálculo cuando el número no es evidente
  (`// 0.4 <= 0.45`).

## Ejemplo (caso de uso con puerto falso)

```ts
import { describe, it, expect } from "vitest";
import { teach } from "../teach-use-case";

const fakeLlm = async () => "respuesta fija del modelo";

describe("teach", () => {
  it("rechaza texto vacío", async () => {
    await expect(
      teach({ llm: fakeLlm, text: "", responseId: "r1", userId: 1 }),
    ).rejects.toThrow("text must not be empty");
  });

  it("devuelve error si una sección del LLM falla", async () => {
    const failing = async () => { throw new Error("boom"); };
    const res = await teach({ llm: failing, text: "hi", responseId: "r1", userId: 1 });
    expect(res.status).toBe("error");
  });
});
```

## Puertas de calidad (Definition of Done)

- `pnpm test` en verde.
- `pnpm typecheck` sin errores.
- Cobertura no baja en el módulo tocado (`pnpm test:coverage`).
- Comportamiento nuevo = al menos una prueba nueva (feliz + error).

## Deuda actual

Solo 3 módulos tienen pruebas hoy. Prioridad de backfill (usa el agente
`test-author`): `english-teacher` (parsers/markdown), `onboarding`, `coaching`,
`progression`, `feedback`, `translation`.
