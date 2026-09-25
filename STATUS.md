# STATUS — estado verificado

Lo imprime el hook `SessionStart`. Sirve para no releer el repo entero para responder
"¿esto anda?". Se actualiza cuando cambia el veredicto, no en cada commit. **Sólo va lo
verificado con un comando**; lo que se supone va en "deuda conocida".

- **Fecha del último gate completo:** 2026-09-25
- **Rama:** `main`
- **Veredicto:** VERDE (`pnpm gate`)
- **Forja:** https://github.com/raalzate/emma-desktop — `main` protegida (PR + check `gate`, aplica a admins)
- **Último release publicado:** v0.2.1 (2026-09-13, marcada Latest): el onboarding deja de
  repreguntar en bucle, la escena reformula en vez de responder con amnesia, karaoke por
  palabra y fantasma del typeahead visible (milestone «v0.2.1 — Correcciones de onboarding
  y chat», issues #154/#159/#160/#161). v0.1.0 quedó retirada de hecho (dmg roto, gotcha
  2026-08-31) y v0.1.1 sigue en BORRADOR con sus 3 instaladores. Publicar un borrador sigue
  siendo gesto del humano.
- **Milestone v0.5.0 fusionado (2026-09-25):** lección en karaoke con audio al lado, escena
  visible en modal durante el chat, correcciones triviales fuera del feedback, gramática con
  tres formas y verbos resaltados, lista de lecciones («Mis lecciones» en Práctica), turnos
  con voz obligatoria y corrector ortográfico en inglés en todas las plataformas (issues
  #167–#174, #182; PRs #175–#179, #181, #185). Más **v0.6.0**: prácticas dinámicas (#183,
  PR #184). Sin release publicada todavía con esto: publicar sigue siendo gesto del humano.
- **Vitrina pública:** https://raalzate.github.io/emma-desktop/ — sitio estático en
  `site/`, publicado en la rama `gh-pages` por `.github/workflows/pages.yml`. Los
  botones de descarga apuntan a la última release publicada (la API de GitHub los
  reescribe con el instalador de cada plataforma; sin red cae a `/releases/latest`).

## Señales

| Señal | Comando | Resultado |
|---|---|---|
| Self-test del arnés | `node scripts/harness-selftest.mjs` | verde — cada regla del config probada con una muestra que el freno bloquea |
| Link-check de docs | `node scripts/docs-linkcheck.mjs` | verde — enlaces, rutas citadas, scripts npm/pnpm citados y honestidad BLOCKING de la constitución |
| Lint de convenciones | `node scripts/repo-lint.mjs` | verde — PUREZA (domain/application/infrastructure), ANY, SECRETO, CONSOLE, ONLY, INCIDENTE |
| Artefactos en su lugar | `node scripts/artifacts-check.mjs` | verde — artefactos SDD en issues de GitHub; sin `specs/` en el repo |
| Diagramas sincronizados | `node scripts/diagrams-check.mjs` | verde — 4 vistas BPMN, 77 elementos; cajas en lenguaje de producto y anclas que apuntan a código que existe |
| Typecheck | `pnpm typecheck` | verde (tsconfig app + electron) |
| Tests | `pnpm test` | verde — 1378 pruebas en 183 archivos |
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

- **Vistas PFA desincronizadas con lo fusionado el 2026-09-25:** «BPMN · Voz y pronunciación»
  (turnos con voz obligatoria, #169), «BPMN · Simulación y feedback» (lista de lecciones,
  #172) y «BPMN · Repaso SRS» (recuerdo escrito, #183) describen el flujo anterior en el
  lienzo. Las instantáneas en `docs/diagramas/` pasan la señal del gate (anclas válidas),
  pero el dibujo en Processflow Architect no se pudo actualizar: la app no respondió en
  `127.0.0.1:7331` durante la sesión. Se sincroniza con el skill `disenar-diagrama` en
  cuanto esté abierta.

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
