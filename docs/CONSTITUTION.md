# Constitución del proyecto — EMMA Desktop

**Versión 1.2.0** · Reglas **no negociables**. Cualquier PR o cambio (humano o agente) debe
cumplirlas. Versionado por enmiendas. Las convenciones del día a día viven en `CLAUDE.md`;
el arnés que hace cumplir esto, en `.claude/harness.config.json` y `scripts/`.

Cada artículo declara su **fuerza**:

- **BLOCKING** — hay un comando que falla si se viola. No hay excepción por prisa.
- **REVIEW** — no es verificable por máquina todavía; lo evalúa una persona o el subagente
  `code-reviewer` / `reviewer`.

> **Regla de honestidad:** un artículo BLOCKING **nombra el comando** que falla. Si no se puede
> nombrar, el artículo es REVIEW. Etiquetar de BLOCKING lo que nadie verifica es la forma más
> rápida de que nadie crea en este documento.

Enmendar esta constitución es un commit propio, con el número de versión subido y el motivo en
el cuerpo.

---

## Artículo 1 — TDD primero · REVIEW

Todo cambio en `domain` o `application` empieza por una prueba que falla. No se fusiona código
de producción sin la prueba que lo justifica. Ver `TESTING.md`.

*Mecanismo:* `pnpm test` en el gate garantiza que las pruebas pasan; el **orden** Red→Green lo
juzga el diff (`code-reviewer`, `tdd-engineer`). Deuda: exigir umbral de cobertura en
`vitest.config.ts` lo volvería BLOCKING.

## Artículo 2 — Pureza del dominio · BLOCKING

`src/domain/` no importa React, Electron, `fs`, `node:*` ni SDKs. Cualquier IO se expresa como
**puerto** (interfaz) y se inyecta. Violarlo rompe la testeabilidad.

*Mecanismo:* regla PUREZA de `node scripts/repo-lint.mjs` (`purity` del config), en el gate.

## Artículo 3 — Regla de dependencias · BLOCKING

Las dependencias apuntan hacia adentro (interface → infrastructure → application → domain).
Ninguna capa importa de una más externa. Ver `ARCHITECTURE.md`.

*Mecanismo:* reglas PUREZA para `src/domain`, `src/application` y `src/infrastructure` en
`node scripts/repo-lint.mjs`, más auditoría del subagente `architecture-guardian`.

## Artículo 4 — Validación en los bordes · REVIEW

Entrada externa (IPC, red, LLM, usuario) se valida con Zod o guard clauses antes de tocar el
dominio. El dominio asume entradas válidas.

*Mecanismo:* ninguno ejecutable todavía — lo revisa `code-reviewer` en cada diff.

## Artículo 5 — Tipado estricto · BLOCKING

Sin `any`. Los contratos públicos llevan tipos explícitos.

*Mecanismo:* `pnpm typecheck` (app + electron) en el gate + regla ANY de
`node scripts/repo-lint.mjs` sobre `src/domain` y `src/application`.

## Artículo 6 — Paridad con EMMA · REVIEW

Este proyecto porta EMMA (Python) conservando el 100% del comportamiento. Cambios de lógica de
negocio verifican paridad con el comportamiento original.

*Mecanismo:* las pruebas de `pnpm test` fijan el comportamiento ya portado; la paridad de lo
nuevo la juzga una persona contra el proyecto Python.

## Artículo 7 — Spec antes de código · REVIEW

Features nuevas o cambios de comportamiento pasan por el flujo SDD
(specify → checklist → plan → testify → tasks → implement → analyze). Los bugfixes
arrancan con un test rojo que reproduzca la falla. Los artefactos viven en `specs/`.

*Mecanismo:* el hook `sdd-router` pone la ruta delante del agente en cada pedido tamaño
feature, y `node scripts/artifacts-check.mjs` verifica que los artefactos estén en `specs/`.
Saltarse el flujo se **declara** en una línea; no se omite en silencio.

## Artículo 8 — Nada se entrega sin gate verde · BLOCKING

Test verde ≠ compila ≠ entregable. El entregable es el gate completo: self-test del arnés,
link-check, lint de convenciones, artefactos, typecheck, tests y build. Una señal **omitida**
no es verde, y `gate:fast` es señal de desarrollo, no entregable. Tras cambiar código corre
`graphify update .` (hook post-commit).

*Mecanismo:* `pnpm gate` (`scripts/gate.sh`), el hook Stop (`.claude/hooks/gate-stop.mjs`) y CI.

## Artículo 9 — Inmersión 100% con andamiaje en español · REVIEW

La práctica conversacional (mensajes de EMMA, sugerencias de respuesta, autocompletado, voz) es
**únicamente en inglés**: EMMA nunca cambia de idioma ni rompe el personaje. Todo el
**andamiaje de la UI** (tooltips, botones, títulos, mensajes de sistema, introducciones,
feedback de producto) va **en español**. El puente entre ambos mundos son las acciones
explícitas del aprendiz (Teach me / Translate), nunca la conversación misma.

**Emma vs protopersonas.** Emma es LA TUTORA: hace el onboarding, explica (Teach me) y da el
feedback final; es siempre femenina y su voz no se configura. Los escenarios los encarnan
**protopersonas** — personajes con nombre, personalidad y voz propia coherente (catálogo en
`../src/domain/personas/`) cuya entrega (tono/actitud/estilo) sí es configurable. Ninguna
superficie mezcla ambos papeles.

*Mecanismo:* ninguno ejecutable — lo revisa una persona en cada superficie nueva.

## Artículo 10 — Integridad de aserciones · BLOCKING

Jamás se ajusta una aserción para que un test pase. Si el test es correcto, se arregla
producción. Si el test es incorrecto, se corrige **en un commit aparte** con la justificación
en el mensaje.

*Mecanismo:* el propio test + revisión del diff. Falsear esto exige mentir en un commit.

## Artículo 11 — Rutas protegidas · BLOCKING

`.env*`, `pnpm-lock.yaml`, `.git/`, derivados (`build/`, `out/`, `.next/`, `coverage/`),
`graphify-out/` y el material fuente del currículo no los edita el agente. Excepción legítima:
la pide el humano y el cambio lo hace él.

*Mecanismo:* `.claude/hooks/protected-paths.mjs` + `.githooks/pre-commit`
(`protectedPaths` del config).

## Artículo 12 — Cada incidente deja infraestructura · BLOCKING

Un problema que costó tiempo termina en el mecanismo más fuerte disponible
(test > hook/lint > comando > markdown), y esa mejora pasa el gate antes de quedar.
`/lesson <incidente>` es el ciclo; el registro, `gotchas.md`.

*Mecanismo:* regla INCIDENTE de `node scripts/repo-lint.mjs` — todo gotcha declara
**Síntoma / Causa / Regla / Mecanismo**.

## Artículo 13 — Conducta ante el error · REVIEW

Leer la salida real (archivo, línea, mensaje) antes de reintentar; reintentar sólo con
hipótesis nueva; presupuesto de **2 intentos** sobre el mismo error, y al tercero se para y se
escala con el diagnóstico. Fallar rápido y con causa vale más que degradar en silencio.

---

### Enmiendas

- **v1.0.0** — Constitución inicial. Establece artículos 1–8.
- **v1.1.0** (2026-07-21) — Añade Artículo 9: inmersión 100% en inglés con andamiaje de UI en
  español.
- **v1.2.0** (2026-08-26) — Adopta el agent-harness: cada artículo declara su fuerza
  (BLOCKING/REVIEW) y su mecanismo; el Artículo 8 pasa de "Definition of Done" a gate único
  (`pnpm gate`); añade artículos 10–13 (integridad de aserciones, rutas protegidas, ciclo del
  incidente, conducta ante el error).
