"use client";

/**
 * Configuración de IA en la nube (opcional). EMMA es local-first: por defecto todo
 * corre en el modelo local. Aquí el usuario elige el modo (local/híbrido/remoto),
 * el proveedor, el modelo y gestiona la llave de API del proveedor activo.
 */

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { modelFor, providerInfo, REMOTE_PROVIDERS } from "@/lib/ai/remote-settings";
import type { AiMode, RemoteProvider } from "@/lib/ai/remote-settings";
import { LabeledSelect } from "./labeled-select";
import { RemoteKeyField } from "./remote-key-field";
import { useRemoteAi } from "./use-remote-ai";

const MODE_OPTIONS = ["local", "hybrid", "remote"] as const;
const MODE_LABELS: Record<AiMode, string> = {
  local: "Local (100% en tu equipo)",
  hybrid: "Híbrido (local + nube)",
  remote: "Remoto (todo en la nube)",
};
const PROVIDER_LABELS = Object.fromEntries(REMOTE_PROVIDERS.map((p) => [p.id, p.label]));

export function RemoteAiConfig() {
  const r = useRemoteAi();
  const provider = providerInfo(r.settings.provider);
  const showRemote = r.settings.mode !== "local";

  return (
    <Card>
      <CardHeader>
        <CardTitle>IA en la nube</CardTitle>
        <CardDescription>
          Opcional. En modo local no se envía nada a internet. El modo híbrido usa la
          nube sólo para lo más complejo; el remoto, para todo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LabeledSelect
          id="ai-mode" label="Modo" value={r.settings.mode}
          options={MODE_OPTIONS} labels={MODE_LABELS}
          onChange={(v) => r.setMode(v as AiMode)}
        />

        {showRemote && (
          <>
            <Separator />
            <LabeledSelect
              id="ai-provider" label="Proveedor" value={r.settings.provider}
              options={REMOTE_PROVIDERS.map((p) => p.id)} labels={PROVIDER_LABELS}
              onChange={(v) => r.setProvider(v as RemoteProvider)}
            />
            <LabeledSelect
              id="ai-model" label="Modelo"
              value={modelFor(r.settings, r.settings.provider)}
              options={provider.models}
              labels={Object.fromEntries(provider.models.map((m) => [m, m]))}
              onChange={r.setModel}
            />
            {r.available ? (
              <RemoteKeyField
                provider={provider}
                configured={!!r.keys[r.settings.provider]}
                onSave={r.saveKey}
                onDelete={r.deleteKey}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                La gestión de llaves sólo está disponible en la app de escritorio.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
