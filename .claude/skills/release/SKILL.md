---
name: release
description: Genera un release estable de EMMA Desktop de punta a punta — verifica rama, gate, CI, versión y tag antes de disparar el build, y valida los instaladores del borrador. Úsalo cuando alguien pida "hacé el release", "publicá la versión X" o "saquemos una release".
---

# Release

Un release es un gate verde congelado en un tag. Nada se tagea que no haya pasado
TODAS las verificaciones de abajo; un paso rojo **detiene el release** y se
reporta el error real — no se "sigue igual".

El porqué de cada pieza (workflows, firma ad-hoc, secrets, problemas
frecuentes) está en `docs/RELEASE.md`; este skill es la mecánica verificada.

## 0 · Dónde nace un release

- El tag `v*` sobre `main` dispara `.github/workflows/release-build.yml`:
  construye dmg (macOS) · exe (Windows) · AppImage (Linux) y deja un
  **borrador** de release en GitHub.
- **Publicar el borrador es gesto del humano** (o suyo vía `! gh release edit
  vX.Y.Z --draft=false --latest` en la sesión). El agente prepara y verifica;
  no publica. Los borradores NO se ven en la página pública de releases: si
  "no aparece", casi siempre está en borrador.

## 1 · Prechequeos (todos, en orden; cualquiera rojo detiene)

| # | Verificación | Comando | Rojo significa |
|---|---|---|---|
| 1 | Rama y árbol | `git status --short --branch` | debe ser `main`, limpio y sin ahead/behind. Trabajo sin fusionar → PR primero. |
| 2 | Main sincronizada | `git pull --ff-only` | si no es fast-forward, la main local divergió: investigá antes. |
| 3 | Gate completo local | `pnpm gate` | la única definición de entregable (7 señales, build incluido). `gate:fast` NO sirve acá. |
| 4 | CI verde en el HEAD | `gh run list --branch main --limit 1` | el mismo commit que vas a tagear debe tener el workflow `ci` en verde. |
| 5 | Versión coherente | leer `version` en `package.json` | debe ser MAYOR que el último tag (`git tag -l 'v*' --sort=-v:refname \| head -1`). Si ya existe `v<version>`, primero sube la versión por PR a main (main está protegida). |
| 6 | STATUS.md al día | leer el encabezado de `STATUS.md` | si el veredicto no es VERDE o la fecha es vieja, actualizalo en el mismo PR del bump. |
| 7 | Notas de release escritas | existe `docs/releases/<version>.md` con sus tres secciones | la regla RELEASE de `scripts/repo-lint.mjs` ya lo exige dentro del gate (paso 3); si el gate pasó, esto está. El workflow usa ese archivo como cuerpo del release. Plantilla: `docs/releases/PLANTILLA.md`. |

## 2 · Tag (el punto de no retorno)

Solo con los 7 prechequeos verdes:

```bash
git tag -a v<version> -m "EMMA Desktop v<version> — <una línea con lo que entra>"
git push origin v<version>
```

El mensaje del tag resume QUÉ entra (mirá `git log <tag-anterior>..HEAD --oneline`),
no cómo se hizo.

## 3 · Verificar el build

```bash
gh run list --workflow release-build.yml --limit 1   # debe estar in_progress/completed
gh run watch <run-id> --exit-status                  # esperar (correlo en segundo plano)
```

Al terminar, el borrador debe tener **los 3 instaladores**:

```bash
gh release view v<version> --json isDraft,assets \
  --jq '{draft: .isDraft, assets: [.assets[].name]}'
```

Esperado: `EMMA-<version>-arm64.dmg`, `EMMA.Setup.<version>.exe`,
`EMMA-<version>.AppImage`. Falta uno → mirá el job del OS que falló con
`gh run view <run-id> --log-failed`; NO publiques un release incompleto.

## 4 · Entrega

Reportá al humano: tag creado, veredicto del build, lista de assets y los dos
caminos para publicar (el `!`-comando de la sesión o GitHub → Releases →
Publish). Si el humano pide rollback antes de publicar: `gh release delete
v<version>` + `git push origin --delete v<version>` borran borrador y tag sin
dejar rastro público.

## Reglas duras

- Nunca tagear con el árbol sucio, con el gate rojo o con CI pendiente/rojo.
- Nunca `electron-builder --publish` local: el instalador lo construye CI desde
  el tag (además el arnés lo deniega).
- Nunca publicar el borrador por decisión propia: es la acción irreversible y
  externa del flujo — la toma el humano.
- Un release fallido que costó tiempo termina en `/lesson`.
