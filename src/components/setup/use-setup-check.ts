"use client";

/**
 * Hook del chequeo de setup: corre la fachada `runtime.setup` y mantiene el
 * estado (corriendo / sonda en repetición / diagnóstico). Lo usan la compuerta
 * de primer arranque y la tarjeta de Settings.
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { SetupFacade } from "@/interface/setup-facade";
import type { ProbeName } from "@/domain/setup/setup-probe-result";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { initialSetupState, setupReducer } from "./setup-check-state";

type Trigger = SetupCheckRecord["trigger"];

export function useSetupCheck(setup: SetupFacade | null, trigger: Trigger, onDone?: () => void) {
  const [state, dispatch] = useReducer(setupReducer, initialSetupState);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const exec = useCallback(
    async (only?: ProbeName, as: Trigger = trigger) => {
      if (!setup) return;
      dispatch(only ? { type: "retest-start", probe: only } : { type: "run-start" });
      try {
        const diagnosis = await setup.run({ trigger: as, only });
        if (alive.current) dispatch({ type: "run-done", diagnosis });
      } catch {
        if (alive.current) dispatch({ type: "run-failed" });
      } finally {
        if (alive.current) onDone?.();
      }
    },
    [setup, trigger, onDone],
  );

  return {
    ...state,
    runAll: useCallback(() => exec(), [exec]),
    retest: useCallback((probe: ProbeName, as?: Trigger) => exec(probe, as), [exec]),
  };
}
