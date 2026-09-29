"use client";

/**
 * Configuración de protopersonas: los personajes que encarna la IA en cada
 * escenario. Su identidad (nombre, rol, voz) es fija y coherente con la
 * persona; lo configurable es su entrega: tono, actitud y estilo de voz.
 */

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PROTOPERSONAS } from "@/domain/personas/protopersona";
import {
  DEFAULT_PERSONA_TUNING,
  type PersonaTuning,
} from "@/domain/personas/persona-tuning";
import {
  loadPersonaTunings,
  savePersonaTuning,
} from "@/infrastructure/persistence/persona-tuning-repository";
import { LabeledSelect } from "./labeled-select";
import { PERSONA_TUNING_FIELDS } from "./personality-options";

const SCENARIO_KEYS = Object.keys(PROTOPERSONAS);

export function PersonaTuningForm() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>(SCENARIO_KEYS[0]);
  const [tunings, setTunings] = useState<Record<string, PersonaTuning>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadPersonaTunings().then(setTunings);
  }, []);

  const persona = PROTOPERSONAS[selected];
  const tuning = tunings[selected] ?? { ...DEFAULT_PERSONA_TUNING };

  const update = (key: keyof PersonaTuning, value: string) =>
    setTunings({ ...tunings, [selected]: { ...tuning, [key]: value } as PersonaTuning });

  const save = async () => {
    setSaving(true);
    try {
      await savePersonaTuning(selected, tuning);
      toast({
        title: "Protopersona saved",
        description: `${persona.name} will use this delivery in their scenes.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protopersonas</CardTitle>
        <CardDescription>
          The characters you practice with in each scene. Their identity and voice
          are fixed; adjust how they behave.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {SCENARIO_KEYS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={key === selected ? "default" : "outline"}
              className="h-7 rounded-full px-3 text-xs"
              title={"Elige a " + PROTOPERSONAS[key].name + " (" + PROTOPERSONAS[key].role + ") para ajustar cómo se comporta"}
              onClick={() => setSelected(key)}
            >
              {PROTOPERSONAS[key].name.split(" ")[0]}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{persona.name}</p>
            <Badge variant="secondary" className="text-[10px]">{persona.role}</Badge>
            <Badge variant="outline" className="text-[10px]">
              {persona.voice === "feminine" ? "Feminine" : "Masculine"} voice
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{persona.trait}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PERSONA_TUNING_FIELDS.map((f) => (
            <LabeledSelect
              key={f.key}
              id={`persona-${selected}-${f.key}`}
              label={f.label}
              value={tuning[f.key]}
              options={f.options}
              labels={f.labels}
              onChange={(v) => update(f.key, v)}
            />
          ))}
        </div>

        <Button title="Guarda los ajustes de comportamiento de este personaje" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save protopersona"}
        </Button>
      </CardContent>
    </Card>
  );
}
