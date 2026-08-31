"use client";

/**
 * Hook de carga del roadmap + recomendación de próximo escenario para un nivel.
 * Aísla el I/O async del runtime de la vista; `reload` refresca tras un reset.
 */

import { useCallback, useEffect, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { Roadmap } from "@/domain/pathway/roadmap";
import type { NextScenarioRecommendation } from "@/domain/pathway/next-scenario-policy";

interface ProgressData {
  roadmap: Roadmap | null;
  recommendation: NextScenarioRecommendation | null;
  loading: boolean;
  reload: () => void;
}

export function useProgressData(runtime: EmmaRuntime | null, level: string | undefined): ProgressData {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [recommendation, setRecommendation] = useState<NextScenarioRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!runtime || !level) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const [rm, rec] = await Promise.all([runtime.roadmap(level), runtime.recommendNext(level)]);
      if (!alive) return;
      setRoadmap(rm);
      setRecommendation(rec);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [runtime, level, nonce]);

  return { roadmap, recommendation, loading, reload };
}
