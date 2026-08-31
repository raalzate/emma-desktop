"use client";

/**
 * Gestión de datos locales: borrar el historial de chats, reiniciar el onboarding
 * o eliminar todos los datos. Cada acción pide confirmación (AlertDialog) por ser
 * destructiva e irreversible. Escribe directamente sobre el almacén JSON local.
 */

import { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getEmmaApi } from "./emma-api";

// Espeja la whitelist de colecciones del proceso principal (main/services/store.ts).
const ALL_COLLECTIONS = [
  "profiles", "chatSettings", "progression", "errorStats", "pathway",
  "goals", "welcomeEvents", "sessions", "preferences", "chatConversations",
];

interface Action {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  confirmTitle: string;
  confirmBody: string;
  run: () => Promise<void>;
}

export function DataManagementCard() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const clear = async (keys: string[]) => {
    const api = getEmmaApi();
    if (!api) throw new Error("Almacén no disponible fuera de Electron.");
    for (const k of keys) await api.storeSet(k, {});
  };

  const actions: Action[] = [
    {
      key: "chats",
      icon: <Trash2 className="h-4 w-4" />,
      title: "Borrar historial de chats",
      description: "Elimina todas las conversaciones guardadas. No afecta tu perfil ni tu progreso.",
      confirmTitle: "¿Borrar todo el historial de chats?",
      confirmBody: "Se eliminarán todas las conversaciones. Esta acción no se puede deshacer.",
      run: async () => {
        await clear(["chatConversations"]);
        toast({ title: "Historial borrado", description: "Se eliminaron todas las conversaciones." });
      },
    },
    {
      key: "onboarding",
      icon: <RotateCcw className="h-4 w-4" />,
      title: "Reiniciar onboarding",
      description: "Borra tu perfil y vuelve a empezar la configuración inicial con Emma.",
      confirmTitle: "¿Reiniciar el onboarding?",
      confirmBody: "Se borrará tu perfil y volverás a la configuración inicial. Tus chats se conservan.",
      run: async () => {
        await clear(["profiles"]);
        window.location.href = "/onboarding";
      },
    },
    {
      key: "all",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Borrar todos los datos",
      description: "Elimina perfil, progreso, ajustes e historial. EMMA quedará como recién instalada.",
      confirmTitle: "¿Borrar TODOS los datos?",
      confirmBody: "Se eliminará todo: perfil, progreso, ajustes e historial de chats. Esta acción es irreversible.",
      run: async () => {
        await clear(ALL_COLLECTIONS);
        window.location.href = "/onboarding";
      },
    },
  ];

  const onConfirm = async (a: Action) => {
    setBusy(a.key);
    try {
      await a.run();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No se pudo completar",
        description: e instanceof Error ? e.message : "Error desconocido.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Zona de datos
        </CardTitle>
        <CardDescription>
          Acciones destructivas sobre tus datos locales. Todo vive en tu equipo; nada se envía a la nube.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((a) => (
          <div key={a.key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0 gap-1" disabled={busy !== null}>
                  {a.icon}
                  Borrar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{a.confirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{a.confirmBody}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onConfirm(a)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, borrar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
