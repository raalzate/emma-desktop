# EMMA Desktop — Guía para agentes

Tutora de inglés conversacional local-first. **Electron + Next.js 15 + React 18 +
TypeScript 5**, IA local (Gemma/LiteRT-LM WebGPU) e híbrida (nube opcional).
Puerto del proyecto Python/Chainlit conservando el 100% de las funcionalidades.

Documentos de referencia:
- Arquitectura y capas → `docs/ARCHITECTURE.md`
- Convenciones de código → `docs/CONVENTIONS.md`
- Estrategia de pruebas y TDD → `docs/TESTING.md`
- Reglas no negociables → `docs/CONSTITUTION.md` (cada artículo con fuerza BLOCKING/REVIEW)
- Estado verificado del repo → `STATUS.md` (lo imprime el hook SessionStart)
- Incidentes que ya costaron horas → `docs/gotchas.md`

---

## El arnés (leer antes de tocar nada)

- **Nada se entrega sin el gate verde.** Es la única definición de entregable: `pnpm gate`.
  La versión rápida (`pnpm gate:fast`) omite el build: es señal de desarrollo, **no**
  entregable. Una señal omitida no es verde.
- La configuración del arnés (señales del gate, rutas protegidas, comandos denegados,
  reglas de pureza) vive en `.claude/harness.config.json`. Si una regla está mal, se
  discute y se cambia ahí — no se ignora.
- `node scripts/harness-selftest.mjs` verifica que los frenos muerden;
  `node scripts/repo-lint.mjs --rules` lista las reglas activas.
- Pre-commit real: `git config core.hooksPath .githooks` (ya activado). Saltarse la
  verificación (`--no-verify`) está prohibido: si el gate estorba, se arregla el gate.
- Trabajo de tamaño feature → flujo SDD; los artefactos viven en `specs/`
  (ver `specs/README.md`). Saltarlo se **declara** en una línea, no se omite en silencio.
- Un incidente que costó tiempo termina en `/lesson`: mecanismo más fuerte disponible
  (test > hook/lint > comando > markdown), validado con el gate. Registro en `docs/gotchas.md`.

---

## graphify (orientación en el código)

Hay un grafo de conocimiento en `graphify-out/` con god nodes, comunidades y
relaciones cross-file.

- Para preguntas sobre el código, primero `graphify query "<pregunta>"` cuando
  exista `graphify-out/graph.json`. Usa `graphify path "<A>" "<B>"` para
  relaciones y `graphify explain "<concepto>"` para conceptos. Devuelven un
  subgrafo acotado, casi siempre más pequeño que leer archivos crudos.
- Si existe `graphify-out/wiki/index.md`, úsalo para navegación amplia.
- Lee `graphify-out/GRAPH_REPORT.md` solo para revisión arquitectónica amplia.
- Tras modificar código, ejecuta `graphify update .` para mantener el grafo.

---

## Arquitectura (regla de dependencias)

Capas por dependencia; **las flechas solo apuntan hacia adentro**:

```
interface / components  ──►  application  ──►  domain
        (React, Electron, IO)     (casos de uso)   (reglas puras)
                    │                   ▲
                    └──► infrastructure ┘   (adaptadores: SQLite/IPC, IA)
```

- **`src/domain/`** — reglas de negocio puras. **Prohibido** importar React,
  Electron, `fetch`, `fs`, o cualquier IO. Solo TypeScript puro + tipos.
- **`src/application/`** — casos de uso. Orquestan el dominio y reciben los
  puertos por **inyección de dependencias** (argumentos), nunca los instancian.
- **`src/infrastructure/`** — adaptadores concretos (repos SQLite vía IPC, IA).
  Implementan puertos definidos en `domain`.
- **`src/interface/` + `src/components/`** — renderer (React/Electron); cablean
  adaptadores a casos de uso.
- **`src/lib/ai/`** — router/providers/engine de IA; adapta el puerto
  `LlmGenerate` (`src/domain/ai/llm-port.ts`).

**Patrón hexagonal (puertos y adaptadores):** el dominio depende SOLO de
interfaces (`LlmGenerate`, repos). El concreto se inyecta desde afuera. Esto
mantiene el dominio testeable sin IO. Ver `teach-use-case.ts` como ejemplo canónico.

---

## Principios no negociables

1. **TDD siempre** — Red → Green → Refactor. Escribe la prueba que falla ANTES
   del código de producción. Nada de dominio/aplicación sin prueba. Ver `docs/TESTING.md`.
2. **Dominio puro** — cero IO/framework en `src/domain/`. Si necesitas IO, es un puerto.
3. **Inyección de dependencias** — los puertos entran por argumentos, no por `import` del concreto.
4. **Validación en los bordes** — entrada externa (IPC, red, LLM, usuario) se
   valida con **Zod** o guard clauses antes de entrar al dominio.
5. **Funciones pequeñas y puras** — una responsabilidad; extrae helpers privados.
   Guard clauses temprano en lugar de anidar.
6. **Tipado estricto** — sin `any`. `typecheck` debe pasar (`pnpm typecheck`).
7. **Paridad de funcionalidad** — este port conserva el 100% del comportamiento
   de EMMA (Python). Al cambiar lógica de negocio, verifica paridad.
8. **Inmersión 100% + andamiaje en español** — la conversación de práctica es
   solo en inglés (EMMA nunca cambia de idioma); tooltips, botones, ayudas y
   mensajes de sistema de la UI van en español. Ver Artículo 9 de la constitución.

---

## Convenciones de código

- **Alias de import** `@/` → `src/` (configurado en `tsconfig`). Usa `@/domain/...`.
- **Nombres de archivo** `kebab-case.ts`. Tipos y funciones en el idioma del dominio.
- **Comentarios en español**, con moderación — solo lógica no obvia. JSDoc breve
  en cabecera de módulos y puertos explicando el *por qué*.
- **Pruebas** en `__tests__/` junto al módulo, `*.test.ts`, descripciones en español.
- **Sin comentarios de relleno.** Comenta solo código complejo.


---

## Comandos

```bash
pnpm install
pnpm electron-dev          # Next dev + tsc watch + Electron
pnpm gate                  # EL entregable: selftest + linkcheck + lint + artefactos + typecheck + tests + build
pnpm gate:fast             # lo mismo sin build — señal de desarrollo, NO entregable
pnpm test                  # vitest run  (usar SIEMPRE antes de dar por hecho un cambio)
pnpm test:watch            # vitest en watch (modo TDD)
pnpm test:coverage         # cobertura (domain/application/lib)
pnpm typecheck             # tsc --noEmit (app + electron)
pnpm build                 # next export + tsc electron + move-out
```

Nota: usa **pnpm**, no npm.

---

## Agentes del proyecto (`.claude/agents/`)

Subagentes especializados; invócalos vía la herramienta Agent con `subagent_type`:

- **`tdd-engineer`** — implementa dominio/aplicación en Red→Green→Refactor.
- **`architecture-guardian`** — audita fronteras de capas y pureza del dominio.
- **`test-author`** — backfill de cobertura para módulos sin pruebas.
- **`code-reviewer`** — revisa calidad, SOLID, guard clauses, validación Zod.
- **`spec-author`** — redacta specs Given/When/Then antes de codificar.
- **`reviewer`** — revisa el diff contra los artículos BLOCKING de la constitución (arnés).
- **`gate-runner`** — corre `pnpm gate` y reporta el veredicto (arnés).
- **`explorer`** — búsqueda de solo lectura para orientarse sin gastar contexto (arnés).

---

## Definición de "hecho"

Un cambio está listo solo cuando **`pnpm gate` está verde** (incluye pruebas,
typecheck, lint de convenciones/capas, link-check, self-test del arnés y build)
y la entrada externa está validada (Artículo 4, lo revisa una persona).
`graphify update .` corre solo en el hook post-commit; si no commiteás todavía,
ejecutalo a mano tras cambiar código.
