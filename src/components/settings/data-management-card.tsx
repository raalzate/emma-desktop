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
    if (!api) throw new Error("Storage is not available outside Electron.");
    for (const k of keys) await api.storeSet(k, {});
  };

  const actions: Action[] = [
    {
      key: "chats",
      icon: <Trash2 className="h-4 w-4" />,
      title: "Clear chat history",
      description: "Deletes every saved conversation. Your profile and progress are not affected.",
      confirmTitle: "Clear the whole chat history?",
      confirmBody: "Every conversation will be deleted. This action cannot be undone.",
      run: async () => {
        await clear(["chatConversations"]);
        toast({ title: "History cleared", description: "Every conversation was deleted." });
      },
    },
    {
      key: "onboarding",
      icon: <RotateCcw className="h-4 w-4" />,
      title: "Restart onboarding",
      description: "Deletes your profile and starts the initial setup with Emma again.",
      confirmTitle: "Restart onboarding?",
      confirmBody: "Your profile will be deleted and you'll go back to the initial setup. Your chats are kept.",
      run: async () => {
        await clear(["profiles"]);
        window.location.href = "/onboarding";
      },
    },
    {
      key: "all",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Delete all data",
      description: "Deletes profile, progress, settings and history. EMMA will be as if freshly installed.",
      confirmTitle: "Delete ALL data?",
      confirmBody: "Everything will be deleted: profile, progress, settings and chat history. This action is irreversible.",
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
        title: "Could not complete",
        description: e instanceof Error ? e.message : "Unknown error.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Data zone
        </CardTitle>
        <CardDescription>
          Destructive actions on your local data. Everything lives on your device; nothing is sent to the cloud.
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
                <Button variant="destructive" size="sm" className="shrink-0 gap-1" title="Acción irreversible: te pide confirmar antes de borrar" disabled={busy !== null}>
                  {a.icon}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{a.confirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{a.confirmBody}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onConfirm(a)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete
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
