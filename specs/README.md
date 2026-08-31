# specs/ — artefactos del flujo SDD

Los artefactos de cada feature (spec, checklist, plan, testify, tasks) viven **acá**, un
directorio por feature. Es la decisión declarada en `.claude/harness.config.json` →
`tracker.artifactsIn: "repo"` y la verifica `node scripts/artifacts-check.mjs`.

Flujo (spec-driven development): spec → checklist → plan → testify → tasks → implement.
El spec lo redacta el subagente `spec-author` (Given/When/Then, FR-XXX, SC-XXX) y lo
implementa `tdd-engineer` en rojo→verde. Bugs: test rojo que reproduzca la falla ANTES
de tocar producción.

En los mensajes de commit de código se cita el ítem de trabajo: `#N` (issue de la forja) o
`spec: specs/<feature>/spec.md`.
