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
    toast({ title: "Settings saved", description: `Window: ${maxTokens} tokens.` });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="max-tokens">Max token window</Label>
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
        <Button variant="secondary" title="Guarda el máximo de tokens por respuesta del modelo local" onClick={save}>Save</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Maximum number of tokens the local engine generates per reply.
      </p>
    </div>
  );
}
