# STATUS — estado verificado

Lo imprime el hook `SessionStart`. Sirve para no releer el repo entero para responder
"¿esto anda?". Se actualiza cuando cambia el veredicto, no en cada commit. **Sólo va lo
verificado con un comando**; lo que se supone va en "deuda conocida".

- **Fecha del último gate completo:** 2026-08-31
- **Rama:** `main`
- **Veredicto:** VERDE (`pnpm gate`)
- **Forja:** https://github.com/raalzate/emma-desktop — `main` protegida (PR + check `gate`, aplica a admins)
- **Último release publicado:** v0.1.0 (2026-08-31) — **ROTO**: el dmg instalado abre
  ventana en blanco (electron-serve apuntaba a `build/main/out`; ver gotcha 2026-08-31)
  y con ícono Electron por defecto. Corregido en `main/paths.ts` + smoke de producción
  en el gate y en `release-build.yml`; la deuda #95 (humo del instalador) quedó pagada
  con freno ejecutable. Pendiente: tagear y publicar v0.1.1 con `/release`.

## Señales

| Señal | Comando | Resultado |
|---|---|---|
| Self-test del arnés | `node scripts/harness-selftest.mjs` | verde — cada regla del config probada con una muestra que el freno bloquea |
| Link-check de docs | `node scripts/docs-linkcheck.mjs` | verde — enlaces, rutas citadas, scripts npm/pnpm citados y honestidad BLOCKING de la constitución |
| Lint de convenciones | `node scripts/repo-lint.mjs` | verde — PUREZA (domain/application/infrastructure), ANY, SECRETO, CONSOLE, ONLY, INCIDENTE |
| Artefactos en su lugar | `node scripts/artifacts-check.mjs` | verde — artefactos SDD en issues de GitHub; sin `specs/` en el repo |
| Typecheck | `pnpm typecheck` | verde (tsconfig app + electron) |
| Tests | `pnpm test` | verde — 879 pruebas en 113 archivos |
| Build de producción | `pnpm build` | verde — next export + tsc electron + move-out |
| Smoke de producción | `pnpm smoke` | verde — Electron carga `app://-` con contenido (camino empaquetado); OMITIDA donde no hay binario de Electron (gate de CI) |

Pre-commit instalado: sí (`core.hooksPath=.githooks`). CI corre el mismo gate: workflow
`.github/workflows/ci.yml` (`pnpm gate`) en cada push/PR a `main`. Push directo a `main`
bloqueado dos veces: `.githooks/pre-push` (local, antes de la red) y la protección de rama
en GitHub (server-side, exige PR con el check `gate` verde). La ruta SDD vive en
issues con `scripts/sdd-github.mjs` (`pnpm sdd:new · sdd:tasks · sdd:status · sdd:mirror`);
el directorio `specs/` se eliminó el 2026-09-01 — los 14 specs y 70 tareas ya estaban
espejados en issues (`sdd:feature` / `sdd:task`) y ahora las issues son el único registro.
Releases: tag `v*` dispara
`.github/workflows/release-build.yml` (dmg · exe · AppImage, borrador de release);
el proceso está escrito en `docs/RELEASE.md`, las notas viven en `docs/releases/`
(regla RELEASE del lint: sin notas de la versión no hay gate verde) y el primer
release real (v0.1.0) se publicó el 2026-08-31.

El gate se probó ROJO a propósito (2026-08-26): un `: any` temporal en `src/domain/` hizo
fallar `repo-lint` con la regla ANY. Un gate que nunca falló es una esperanza, no un gate.

**Madurez del arnés (escala L0–L4 de `docs/buenas-practicas.md`): L3, camino a L4** — gate
único con pre-commit y hooks del ciclo del agente vivos (self-test verde), rutas protegidas,
subagentes y comandos instalados, CI corriendo el mismo gate y `main` protegida (2026-08-31).
El ciclo RHO se estrenó el 2026-08-31: `/harness-audit` encontró punteros muertos y un
artículo BLOCKING sin freno, y `/lesson` los convirtió en dos frenos nuevos del link-check
con sus casos de self-test (primer gotcha real en `docs/gotchas.md`). L4 pide que el ciclo
sea rutina, no estreno.

## Deuda conocida

- **Cobertura sin umbral:** `vitest.config.ts` no exige mínimo de cobertura; el Artículo 1
  (TDD) es REVIEW hasta que se declare `coverage.thresholds` (mecanismo candidato:
  `pnpm test:coverage` como señal del gate con umbral).
- **Smoke de producción no corre en el gate de CI:** `ci.yml` instala con
  `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, así que la señal se OMITE ahí (omitido ≠ pasó);
  cubre el gate local y el workflow de release (3 plataformas). Aceptado a propósito
  (~100 MB por run); revisar si vuelve a doler.
- **Artículos REVIEW de la constitución** (1, 4, 6, 7, 9, 13): sin comando que falle; los
  juzga `reviewer`/`code-reviewer` en cada diff.
- **Artículo 10 reclasificado a REVIEW** (v1.3.0): "integridad de aserciones" no es verificable
  por máquina; lo juzga la revisión del diff. Volvería a BLOCKING sólo con un freno real.
