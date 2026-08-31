"use client";

/** Gestión de la llave del proveedor: pegar/guardar/borrar. Nunca muestra el valor. */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { RemoteProvider, RemoteProviderInfo } from "@/lib/ai/remote-settings";

interface RemoteKeyFieldProps {
  provider: RemoteProviderInfo;
  configured: boolean;
  onSave: (provider: RemoteProvider, key: string) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (provider: RemoteProvider) => Promise<void> | void;
}

export function RemoteKeyField({ provider, configured, onSave, onDelete }: RemoteKeyFieldProps) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await onSave(provider.id, value.trim());
      if (res.ok) { setValue(""); toast({ title: "Llave guardada" }); }
      else toast({ title: "No se pudo guardar", description: res.error, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor="api-key">Llave de API</Label>
        <Badge variant={configured ? "default" : "outline"}>
          {configured ? "Configurada" : "No configurada"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          id="api-key"
          type="password"
          placeholder={configured ? "•••••••• (guardada)" : "Pega tu llave"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={save} disabled={busy || !value.trim()}>Guardar</Button>
        {configured && (
          <Button variant="ghost" onClick={() => void onDelete(provider.id)}>Borrar</Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Se guarda cifrada en tu equipo.{" "}
        <a href={provider.keysUrl} target="_blank" rel="noreferrer" className="underline">
          Obtener una llave
        </a>
      </p>
    </div>
  );
}
