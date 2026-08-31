<!-- Copiá este archivo a docs/releases/<versión>.md ANTES de tagear.
     La regla RELEASE del lint exige: que exista el archivo de la versión de
     package.json, que tenga las tres secciones ### y que el texto nombre la
     versión. Esta plantilla no se valida a sí misma. -->

## EMMA <versión> · beta

Una o dos frases: qué es esta versión **para quien la instala** (no para quien
la programó). Ejemplo: «Primera beta pública de la tutora de inglés local-first:
la IA corre en tu máquina y la nube es opcional».

### Cambios

Qué cambia para quien usa la app — funcionalidades, no implementación:

- …
- …

### Descargas

| SO | Archivo | Cómo abrir la primera vez |
|---|---|---|
| macOS (Apple Silicon) | `EMMA-<versión>-arm64.dmg` | clic derecho → Abrir (la firma es ad-hoc: doble clic muestra «no se puede verificar») |
| Windows | `EMMA.Setup.<versión>.exe` | SmartScreen: «Más información» → «Ejecutar de todas formas» |
| Linux | `EMMA-<versión>.AppImage` | `chmod +x` al archivo y ejecutarlo |

### Requisitos

- GPU con **WebGPU** (la IA local corre en el dispositivo; sin WebGPU no hay modo local).
- La **nube es opcional**: se activa en Ajustes con una llave propia del proveedor.
