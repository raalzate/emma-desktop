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
  local: "Local (100% on your device)",
  hybrid: "Hybrid (local + cloud)",
  remote: "Remote (everything in the cloud)",
};
const PROVIDER_LABELS = Object.fromEntries(REMOTE_PROVIDERS.map((p) => [p.id, p.label]));

export function RemoteAiConfig() {
  const r = useRemoteAi();
  const provider = providerInfo(r.settings.provider);
  const showRemote = r.settings.mode !== "local";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud AI</CardTitle>
        <CardDescription>
          Optional. In local mode nothing is sent to the internet. Hybrid mode uses the
          cloud only for the hardest tasks; remote mode, for everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LabeledSelect
          id="ai-mode" label="Mode" value={r.settings.mode}
          options={MODE_OPTIONS} labels={MODE_LABELS}
          onChange={(v) => r.setMode(v as AiMode)}
        />

        {showRemote && (
          <>
            <Separator />
            <LabeledSelect
              id="ai-provider" label="Provider" value={r.settings.provider}
              options={REMOTE_PROVIDERS.map((p) => p.id)} labels={PROVIDER_LABELS}
              onChange={(v) => r.setProvider(v as RemoteProvider)}
            />
            <LabeledSelect
              id="ai-model" label="Model"
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
                Key management is only available in the desktop app.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
