# specs/ — artefactos del flujo Sofka

Los artefactos de cada feature (spec, checklist, plan, testify, tasks) viven **acá**, un
directorio por feature. Es la decisión declarada en `.claude/harness.config.json` →
`tracker.artifactsIn: "repo"` y la verifica `node scripts/artifacts-check.mjs`.

Flujo: `/sofka-01-specify` → `/sofka-03-checklist` → `/sofka-02-plan` → `/sofka-04-testify` →
`/sofka-05-tasks` → `/sofka-07-implement`. Bugs: `/sofka-bugfix`.

En los mensajes de commit de código se cita el ítem de trabajo: `#N` (issue de la forja) o
`spec: specs/<feature>/spec.md`.
