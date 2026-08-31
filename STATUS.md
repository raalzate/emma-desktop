# STATUS — estado verificado

Lo imprime el hook `SessionStart`. Sirve para no releer el repo entero para responder
"¿esto anda?". Se actualiza cuando cambia el veredicto, no en cada commit. **Sólo va lo
verificado con un comando**; lo que se supone va en "deuda conocida".

- **Fecha del último gate completo:** 2026-08-26
- **Rama:** `main`
- **Veredicto:** VERDE (`pnpm gate`)

## Señales

| Señal | Comando | Resultado |
|---|---|---|
| Self-test del arnés | `node scripts/harness-selftest.mjs` | verde — cada regla del config probada con una muestra que el freno bloquea |
| Link-check de docs | `node scripts/docs-linkcheck.mjs` | verde |
| Lint de convenciones | `node scripts/repo-lint.mjs` | verde — PUREZA (domain/application/infrastructure), ANY, SECRETO, CONSOLE, ONLY, INCIDENTE |
| Artefactos en su lugar | `node scripts/artifacts-check.mjs` | verde — artefactos Sofka en `specs/` |
| Typecheck | `pnpm typecheck` | verde (tsconfig app + electron) |
| Tests | `pnpm test` | verde — 879 pruebas en 113 archivos |
| Build de producción | `pnpm build` | verde — next export + tsc electron + move-out |

Pre-commit instalado: sí (`core.hooksPath=.githooks`). CI corre el mismo gate: workflow
`.github/workflows/ci.yml` escrito (`pnpm gate`), **sin ejecutar todavía** — el repo no
tiene remoto.

El gate se probó ROJO a propósito (2026-08-26): un `: any` temporal en `src/domain/` hizo
fallar `repo-lint` con la regla ANY. Un gate que nunca falló es una esperanza, no un gate.

**Madurez del arnés (escala L0–L4 de `docs/buenas-practicas.md`): L3** — gate único con
pre-commit y hooks del ciclo del agente vivos (self-test verde), rutas protegidas, subagentes
y comandos instalados. L4 pide el ciclo RHO estrenado (`/lesson` aún sin usar con un
incidente real) y CI corriendo de verdad.

## Deuda conocida

- **Cobertura sin umbral:** `vitest.config.ts` no exige mínimo de cobertura; el Artículo 1
  (TDD) es REVIEW hasta que se declare `coverage.thresholds` (mecanismo candidato:
  `pnpm test:coverage` como señal del gate con umbral).
- **CI nunca corrió:** no hay remoto configurado. Al publicar el repo, verificar que el job
  `gate` pasa y activar protección de rama.
- **Repo sin commits:** todo el árbol está sin versionar; el primer commit disparará los
  hooks `.githooks/` por primera vez (commit-msg exigirá `#N`, `spec: specs/…` o
  `sin-issue: <motivo>`).
- **Artículos REVIEW de la constitución** (1, 4, 6, 7, 9, 13): sin comando que falle; los
  juzga `reviewer`/`code-reviewer` en cada diff.
- `docs/gotchas.md` sólo tiene la entrada de formato: ningún incidente registrado todavía.
