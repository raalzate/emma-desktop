import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // El tsconfig de Next usa `jsx: "preserve"`; sin esto vitest (Vite 8/oxc)
  // no puede importar componentes .tsx en pruebas de render (parse error de JSX).
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    // `.claude/worktrees/`: copias del repo de los subagentes; sin esto el gate
    // del checkout principal corre sus pruebas y las de sus node_modules.
    exclude: ["**/node_modules/**", "build", "dist", "out", ".next", ".claude/worktrees/**"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**", "src/lib/**"],
    },
  },
});
