"use client";

/**
 * Traducción al español bajo demanda para la práctica de pronunciación (#357):
 * la oración del par mínimo (sólo tras acertar) y cada frase del shadowing.
 * Cachea por texto: volver a pasar el mouse no vuelve a llamar al modelo.
 */

import { useEffect, useState } from "react";
import { useEmma } from "@/interface/emma-context";

const cache = new Map<string, string>();

export function useSpanishTranslation(text: string, enabled: boolean): { loading: boolean; text: string | null } {
  const { runtime } = useEmma() as { runtime?: { translate(t: string, l: string): Promise<{ pairs: { target: string }[] }> } };
  const [state, setState] = useState<{ loading: boolean; text: string | null }>(() => ({
    loading: false,
    text: cache.get(text) ?? null,
  }));

  useEffect(() => {
    if (!enabled || !runtime || cache.has(text)) {
      setState({ loading: false, text: cache.get(text) ?? null });
      return;
    }
    let alive = true;
    setState({ loading: true, text: null });
    runtime
      .translate(text, "es")
      .then(({ pairs }) => {
        const es = pairs.map((p) => p.target).join(" ").trim();
        if (es) cache.set(text, es);
        if (alive) setState({ loading: false, text: es || null });
      })
      .catch(() => alive && setState({ loading: false, text: null }));
    return () => {
      alive = false;
    };
  }, [text, enabled, runtime]);

  return state;
}
