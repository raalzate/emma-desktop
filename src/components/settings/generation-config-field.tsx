"use client";

/** Ventana de tokens del motor local (maxTokens), persistida en ai-config. */

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getGenerationConfig, setGenerationConfig } from "@/lib/ai-config";

export function GenerationConfigField() {
  const { toast } = useToast();
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  useEffect(() => setMaxTokens(getGenerationConfig().maxTokens), []);

  const save = () => {
    setGenerationConfig({ ...getGenerationConfig(), maxTokens });
    toast({ title: "Configuración guardada", description: `Ventana: ${maxTokens} tokens.` });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="max-tokens">Ventana máxima de tokens</Label>
      <div className="flex gap-2">
        <Input
          id="max-tokens"
          type="number"
          min={256}
          max={32768}
          step={256}
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value) || 0)}
          className="max-w-[10rem]"
        />
        <Button variant="secondary" onClick={save}>Guardar</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Máximo de tokens que genera el motor local por respuesta.
      </p>
    </div>
  );
}
