// Empaqueta emma-lib.ts (alias @/ incluidos) a un ESM que Node carga sin TS.
export default {
  resolve: { tsconfigPaths: true },
  logLevel: "warn",
  build: {
    ssr: "evals/a1/emma-lib.ts",
    outDir: "evals/a1/.build",
    emptyOutDir: true,
    rollupOptions: { output: { format: "es", entryFileNames: "emma-lib.mjs" } },
  },
};
