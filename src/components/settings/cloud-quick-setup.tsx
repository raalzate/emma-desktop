"use client";

/**
 * Atajo a la nube desde la puerta de IA: para el equipo que no puede correr el
 * modelo local (sin WebGPU o poca RAM). Pega una llave de Gemini (capa gratuita),
 * el main la verifica y la cifra, y el modo pasa a `remote`. Dice qué sale del
 * equipo antes de pedir la llave.
 */

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadAiSettings, providerInfo, saveAiSettings } from "@/lib/ai/remote-settings";
import type { RemoteProvider } from "@/lib/ai/remote-settings";
import { RemoteKeyField } from "./remote-key-field";
import { getEmmaApi } from "./emma-api";

const GEMINI = providerInfo("gemini");

interface CloudQuickSetupProps {
  recommended: boolean;
  onReady: () => void;
}

export function CloudQuickSetup({ recommended, onReady }: CloudQuickSetupProps) {
  const api = getEmmaApi();

  const save = async (provider: RemoteProvider, key: string) => {
    if (!api) return { ok: false, error: "Only available in the desktop app." };
    const res = await api.setAiKey(provider, key);
    if (res.ok) {
      saveAiSettings({ ...loadAiSettings(), mode: "remote", provider });
      onReady();
    }
    return res;
  };

  return (
    <Card className={recommended ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Use cloud AI</CardTitle>
          {recommended && <Badge>Recommended for this computer</Badge>}
        </div>
        <CardDescription>
          No download needed. Paste a Google Gemini API key — Google AI Studio offers a
          free tier. You can switch back to local AI anytime in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <RemoteKeyField provider={GEMINI} configured={false} onSave={save} onDelete={() => {}} />
        <p className="text-xs text-muted-foreground">
          Your conversation is sent to Google to generate Emma&apos;s replies. On the free
          tier, Google may use that data to improve its products.
        </p>
      </CardContent>
    </Card>
  );
}
