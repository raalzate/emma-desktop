"use client";

/**
 * Contexto React que provee el runtime de EMMA (raíz de composición) + el perfil
 * y los ajustes cargados. Los componentes consumen `useEmma()`; nunca instancian
 * casos de uso ni tocan el almacén directamente.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createEmmaRuntime, type EmmaRuntime } from "./emma-runtime";
import { loadProfile } from "@/infrastructure/persistence/profile-repository";
import { loadChatSettings } from "@/infrastructure/persistence/chat-settings-repository";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";

interface EmmaContextValue {
  runtime: EmmaRuntime | null;
  profile: UserProfile | null;
  settings: ChatSettings | null;
  ready: boolean;
  refreshProfile: () => Promise<void>;
  setSettings: (s: ChatSettings) => void;
}

const Ctx = createContext<EmmaContextValue | null>(null);

export function EmmaProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<EmmaRuntime | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettingsState] = useState<ChatSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rt = await createEmmaRuntime();
      const [p, s] = await Promise.all([loadProfile(), loadChatSettings()]);
      if (!alive) return;
      setRuntime(rt);
      setProfile(p);
      setSettingsState(s);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refreshProfile = async () => setProfile(await loadProfile());

  return (
    <Ctx.Provider
      value={{ runtime, profile, settings, ready, refreshProfile, setSettings: setSettingsState }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** Acceso al contexto de EMMA. Lanza si se usa fuera del provider. */
export function useEmma(): EmmaContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEmma debe usarse dentro de <EmmaProvider>.");
  return v;
}
