# Convenciones de código — EMMA Desktop

## TypeScript

- **Estricto.** Sin `any`. Prefiere `unknown` + narrowing, o un tipo Zod inferido.
- **Alias** `@/` → `src/`. Importa `@/domain/...`, no rutas relativas largas.
- **Tipos explícitos** en fronteras públicas (args y retorno de funciones exportadas).
- **`import type { ... }`** para imports que son solo tipos.
- **`readonly` / `as const`** para datos que no deben mutar.

## Nombres y archivos

- Archivos `kebab-case.ts`; pruebas `nombre.test.ts` en `__tests__/` hermano.
- Un módulo = una responsabilidad. Funciones cortas; extrae helpers privados.
- Nombres del dominio en el idioma del negocio; sin abreviaturas crípticas.

## Estilo de funciones

- **Guard clauses temprano** en vez de anidar `if/else`.
- Funciones **puras** en `domain` (sin efectos, sin `Date.now()` oculto donde
  importe el determinismo — inyéctalo si el test lo necesita).
- Evita parámetros booleanos posicionales; usa un objeto `args` nombrado.
- Errores: lanza `Error` con mensaje claro en la validación de entrada; los casos
  de uso convierten fallos en resultados tipados (`successResult`/`errorResult`).

## Validación (bordes)

- Toda entrada externa (IPC, red, respuesta del LLM, formulario) se valida antes
  de entrar al dominio: **Zod** para estructuras, guard clauses para invariantes
  simples (`if (userId <= 0) throw ...`).
- El dominio asume que sus entradas ya son válidas.

## React / UI

- Componentes shadcn/Radix en `components/ui`; features en `components/<feature>`.
- Sin reglas de negocio en componentes: llama a casos de uso.
- `useMemo`/`useCallback` para evitar recrear refs que disparan re-render.

## Comentarios

- **En español, con moderación.** Solo lógica no obvia o el *por qué*.
- JSDoc breve en cabecera de módulos/puertos. Nada de comentarios que repiten el código.

## Commits

- Conventional Commits. Sujeto ≤ 50 chars. Cuerpo solo si el "por qué" no es obvio.
- No commitees código que no pase `pnpm test` y `pnpm typecheck`.
