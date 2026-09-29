"use client";

/**
 * Dialog "🌐 Translate": traduce el turno de Emma al idioma elegido y muestra los
 * pares bilingües (fuente → destino). Recarga la traducción al cambiar idioma.
 */

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmma } from "@/interface/emma-context";
import { SpeakButton } from "./speak-button";
import { SUPPORTED_LANGUAGES } from "@/domain/translation/supported-language";
import type { BilingualPair } from "@/domain/translation/translation-prompt";

export function TranslateDialog({ text, onClose }: { text: string | null; onClose: () => void }) {
  const { runtime } = useEmma();
  const [lang, setLang] = useState("es");
  const [pairs, setPairs] = useState<BilingualPair[] | null>(null);

  useEffect(() => {
    if (!text || !runtime) return;
    let alive = true;
    setPairs(null);
    runtime.translate(text, lang).then((r) => alive && setPairs(r.pairs));
    return () => {
      alive = false;
    };
  }, [text, lang, runtime]);

  return (
    <Dialog open={!!text} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" /> Translate
          </DialogTitle>
        </DialogHeader>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SUPPORTED_LANGUAGES).map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-3">
          {pairs === null && <Skeleton className="h-24 w-full" />}
          {pairs?.map((p, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
              <SpeakButton text={p.source} />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground">{p.source}</p>
                <p className="font-medium">{p.target}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
