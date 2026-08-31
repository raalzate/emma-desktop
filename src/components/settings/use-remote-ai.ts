"use client";

/**
 * Estado de la IA remota: preferencias (modo/proveedor/modelo) en localStorage y
 * estado de llaves (configurada/no) que vive cifrado en el proceso main. Nunca
 * expone el valor de la llave, sólo si existe.
 */

import { useCallback, useEffect, useState } from "react";
import {
  loadAiSettings, saveAiSettings, type AiMode, type AiRemoteSettings,
  type KeyStatus, type RemoteProvider,
} from "@/lib/ai/remote-settings";
import { getEmmaApi } from "./emma-api";

export function useRemoteAi() {
  const api = getEmmaApi();
  const [settings, setSettings] = useState<AiRemoteSettings>(loadAiSettings());
  const [keys, setKeys] = useState<KeyStatus>({});

  const refreshKeys = useCallback(async () => {
    if (!api) return;
    setKeys((await api.getAiKeyStatus()) as KeyStatus);
  }, [api]);

  useEffect(() => { void refreshKeys(); }, [refreshKeys]);

  const persist = useCallback((next: AiRemoteSettings) => {
    saveAiSettings(next);
    setSettings(next);
  }, []);

  const setMode = (mode: AiMode) => persist({ ...settings, mode });
  const setProvider = (provider: RemoteProvider) => persist({ ...settings, provider });
  const setModel = (model: string) =>
    persist({ ...settings, models: { ...settings.models, [settings.provider]: model } });

  const saveKey = useCallback(async (provider: RemoteProvider, key: string) => {
    if (!api) return { ok: false };
    const res = await api.setAiKey(provider, key);
    await refreshKeys();
    return res;
  }, [api, refreshKeys]);

  const deleteKey = useCallback(async (provider: RemoteProvider) => {
    if (!api) return;
    await api.deleteAiKey(provider);
    await refreshKeys();
  }, [api, refreshKeys]);

  return {
    available: !!api, settings, keys,
    setMode, setProvider, setModel, saveKey, deleteKey,
  };
}
