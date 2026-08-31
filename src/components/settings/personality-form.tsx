"use client";

/**
 * Formulario de personalidad de Emma: seis Select ligados a ChatSettings. Al
 * guardar persiste con saveChatSettings y refresca el contexto (setSettings).
 */

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEmma } from "@/interface/emma-context";
import { saveChatSettings } from "@/infrastructure/persistence/chat-settings-repository";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import { LabeledSelect } from "./labeled-select";
import { PERSONALITY_FIELDS } from "./personality-options";

export function PersonalityForm() {
  const { settings, setSettings, ready } = useEmma();
  const { toast } = useToast();
  const [draft, setDraft] = useState<ChatSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(settings), [settings]);

  if (!ready || !draft) return <FormSkeleton />;

  const update = (key: keyof ChatSettings, value: string) =>
    setDraft({ ...draft, [key]: value } as ChatSettings);

  const save = async () => {
    setSaving(true);
    try {
      await saveChatSettings(draft);
      setSettings(draft);
      toast({ title: "Personalidad guardada", description: "Emma usará estos ajustes." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalidad de Emma</CardTitle>
        <CardDescription>Ajusta cómo habla y reacciona tu tutora.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {PERSONALITY_FIELDS.map((f) => (
            <LabeledSelect
              key={f.key}
              id={`personality-${f.key}`}
              label={f.label}
              value={draft[f.key]}
              options={f.options}
              labels={f.labels}
              onChange={(v) => update(f.key, v)}
            />
          ))}
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar personalidad"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Esqueleto de carga mientras el contexto no está listo. */
function FormSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
