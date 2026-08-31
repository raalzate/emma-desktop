# Publicar una versión de EMMA Desktop

El proceso completo, del bump al borrador publicado. La mecánica paso a paso
para el agente vive en el skill `/release` (`.claude/skills/release/SKILL.md`);
este doc explica el **porqué** de cada pieza y lo que el YAML no cuenta.

## Los dos workflows

| Workflow | Archivo | Lo dispara | Qué hace |
|---|---|---|---|
| CI | `.github/workflows/ci.yml` | cada push/PR a `main` | corre `pnpm gate` — es el check que exige la protección de rama |
| Build and Publish Release | `.github/workflows/release-build.yml` | tag `v*` o disparo manual | matriz mac/win/linux con electron-builder; con tag, además crea el **borrador** de release |

Dos etapas a propósito: la matriz solo empaqueta y sube artefactos; un único
job `release` los baja y crea el borrador (publicar desde la matriz sería una
carrera de tres jobs contra el mismo tag).

Antes de empaquetar, cada job de la matriz corre el **smoke de producción**
(`pnpm smoke` → `scripts/package-smoke.mjs`): lanza Electron por el camino
empaquetado (`electron-serve` + `app://-`) y exige que el renderer cargue con
contenido. Existe porque v0.1.0 compiló verde y salió con ventana en blanco
(gotcha 2026-08-31 en `docs/gotchas.md`): compilar no es cargar. La misma
señal vive en el gate local; en el gate de CI se OMITE (ahí no se descarga el
binario de Electron).

## Artefactos por plataforma

| SO | Formato | Sale de |
|---|---|---|
| macOS | `EMMA-<versión>-arm64.dmg` | `macos-latest` |
| Windows | `EMMA.Setup.<versión>.exe` (NSIS) | `windows-latest` |
| Linux | `EMMA-<versión>.AppImage` | `ubuntu-latest` |

Siempre quedan como artefactos del run (30 días). Con tag, además se adjuntan
al borrador — y `fail_on_unmatched_files: true` pone el job rojo si falta un
formato: un release sin un instalador no debe salir verde.

## Notas de release (BLOQUEANTE)

El job `release` usa `docs/releases/<versión>.md` como cuerpo del release
(`body_path`). Si el archivo no existe, GitHub autogenera una lista de commits
que no le dice nada a quien instala — por eso la regla **RELEASE** de
`scripts/repo-lint.mjs` (señal del gate) exige, para la versión actual de
`package.json`:

1. que `docs/releases/<versión>.md` exista,
2. que tenga las secciones `### Cambios`, `### Descargas` y `### Requisitos`,
3. que el texto nombre la versión (si no la nombra, se copió de otra release).

Plantilla: `docs/releases/PLANTILLA.md`. Las notas se escriben **para quien
instala**, no para quien programó.

## Publicar por tag, paso a paso

1. **Bump**: subí `"version"` en `package.json` y escribí
   `docs/releases/<versión>.md` — mismo PR; el gate no pasa sin las notas.
2. **Verificá main**: rama limpia, `pnpm gate` verde local, CI verde en el
   commit exacto que vas a tagear. (El skill `/release` corre todo esto.)
3. **Tag**: `git tag -a v<versión> -m "..." && git push origin v<versión>`.
   El tag lleva `v` adelante; el workflow filtra `v*`.
4. **Esperá el build** y revisá el borrador: los tres instaladores presentes y
   las notas correctas.
5. **Publicá a mano** (GitHub → Releases → Publish, o
   `gh release edit v<versión> --draft=false --latest`). El borrador existe
   justamente para que un humano mire antes del paso irreversible.

## Builds sin release (workflow_dispatch)

Actions → «Build and Publish Release» → *Run workflow*. Corre la misma matriz
pero **no** crea release (el job `release` exige un tag): sirve para probar el
empaquetado de las tres plataformas sin comprometerse a una versión. Los
instaladores quedan como artefactos del run.

## Firma de código

- **El split `SIGN_MAC`**: GitHub expande un secret ausente a `""` (cadena
  vacía, no undefined) y electron-builder trata `CSC_LINK=""` como «firmá con
  este certificado» → intenta importar una ruta vacía y muere con *not a
  file*. Por eso el workflow decide ANTES, con el secret, cuál de los dos
  pasos de empaquetado corre.
- **Sin certificado (hoy)**: firma **ad-hoc** en macOS. En Apple Silicon un
  binario sin ninguna firma sale «dañado» al abrirlo — arm64 exige al menos
  ad-hoc (`mac.identity=-`), con `hardenedRuntime` apagado (solo hace falta
  para notarizar).
- **Para firmar de verdad**: configurá los secrets `CSC_LINK` +
  `CSC_KEY_PASSWORD` (macOS), `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD`
  (Windows) y `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`
  (notarización). Con `CSC_LINK` presente, el workflow cambia solo al paso
  firmado.

## Instalar builds sin firma de confianza

| SO | Aviso | Cómo pasarlo |
|---|---|---|
| macOS | «no se puede verificar el desarrollador» | clic derecho sobre la app → Abrir (una sola vez) |
| Windows | SmartScreen | «Más información» → «Ejecutar de todas formas» |
| Linux | AppImage sin permiso de ejecución | `chmod +x EMMA-<versión>.AppImage` |

## Problemas frecuentes

- **El tag no disparó nada** → le falta la `v` (`0.1.0` en vez de `v0.1.0`).
- **macOS muere con "not a file"** → alguien pasó `CSC_LINK` vacío al paso
  firmado; el split `SIGN_MAC` existe para esto, no lo puentees.
- **El borrador quedó sin un instalador** → mirá el job de esa plataforma con
  `gh run view <run-id> --log-failed`; `fail_on_unmatched_files` ya habrá
  puesto rojo el job `release`.
- **«No veo el release»** → está en **borrador**: los borradores no aparecen
  en la página pública; solo los ve quien tiene permiso de escritura.
- **Publicaste de más** → antes de publicar, un borrador se borra sin rastro:
  `gh release delete v<versión>` y `git push origin --delete v<versión>`.
- **El smoke muere con «Electron failed to install correctly»** → la cache de
  pnpm se restauró "construida" por un install con `ELECTRON_SKIP_BINARY_DOWNLOAD=1`
  (el gate de CI) y el binario no está. El smoke se auto-repara corriendo
  `node_modules/electron/install.js`; si ves esto igual, el download falló de
  verdad (red/proxy). Pasó en el primer build de v0.1.1 (Linux).
- **La app instalada abre en blanco** → el renderer no cargó `app://-`
  (ruta del export rota, típico `__dirname` mal asumido en el main compilado).
  Reproducí local con `pnpm build && pnpm smoke`; la resolución de rutas vive
  en `main/paths.ts` con su test. Pasó en v0.1.0.
- **Ícono genérico de Electron** → `build.mac.icon`/`win.icon`/`linux.icon`
  apuntan a un archivo inexistente y electron-builder cae al default **sin
  fallar**. Hoy los tres apuntan a `assets/icon.png` (512 px; electron-builder
  lo convierte a icns/ico). Pasó en v0.1.0.
