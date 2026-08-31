# STATUS — estado verificado

Lo imprime el hook `SessionStart`. Sirve para no releer el repo entero para responder
"¿esto anda?". Se actualiza cuando cambia el veredicto, no en cada commit. **Sólo va lo
verificado con un comando**; lo que se supone va en "deuda conocida".

- **Fecha del último gate completo:** 2026-08-31
- **Rama:** `main`
- **Veredicto:** VERDE (`pnpm gate`)
- **Forja:** https://github.com/raalzate/emma-desktop — `main` protegida (PR + check `gate`, aplica a admins)

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
`.github/workflows/ci.yml` (`pnpm gate`) en cada push/PR a `main`. Push directo a `main`
bloqueado dos veces: `.githooks/pre-push` (local, antes de la red) y la protección de rama
en GitHub (server-side, exige PR con el check `gate` verde). La ruta SDD se espeja en
issues con `scripts/sdd-github.mjs` (`pnpm sdd:new · sdd:tasks · sdd:status · sdd:mirror`);
los artefactos siguen viviendo en `specs/`. Releases: tag `v*` dispara
`.github/workflows/release-build.yml` (dmg · exe · AppImage, borrador de release).

El gate se probó ROJO a propósito (2026-08-26): un `: any` temporal en `src/domain/` hizo
fallar `repo-lint` con la regla ANY. Un gate que nunca falló es una esperanza, no un gate.

**Madurez del arnés (escala L0–L4 de `docs/buenas-practicas.md`): L3** — gate único con
pre-commit y hooks del ciclo del agente vivos (self-test verde), rutas protegidas, subagentes
y comandos instalados, CI corriendo el mismo gate y `main` protegida (2026-08-31). L4 pide
el ciclo RHO estrenado (`/lesson` aún sin usar con un incidente real).

## Deuda conocida

- **Cobertura sin umbral:** `vitest.config.ts` no exige mínimo de cobertura; el Artículo 1
  (TDD) es REVIEW hasta que se declare `coverage.thresholds` (mecanismo candidato:
  `pnpm test:coverage` como señal del gate con umbral).
- **Release workflow sin estrenar:** `release-build.yml` está escrito pero ningún tag `v*`
  lo disparó todavía; el primer release verificará el empaquetado en las 3 plataformas.
- **Artículos REVIEW de la constitución** (1, 4, 6, 7, 9, 13): sin comando que falle; los
  juzga `reviewer`/`code-reviewer` en cada diff.
- `docs/gotchas.md` sólo tiene la entrada de formato: ningún incidente registrado todavía.
