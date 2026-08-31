"use client";

/** Botón "Reiniciar nivel": confirma en AlertDialog y ejecuta ResetLevelUseCase. */

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ResetLevelUseCase } from "@/application/pathway/reset-level-use-case";
import { USER_ID } from "@/interface/di/repositories";
import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";

interface Props {
  repo: IPathwayRepository;
  level: string;
  onReset: () => void;
}

export function ResetLevelButton({ repo, level, onReset }: Props) {
  const [busy, setBusy] = useState(false);
  const handleReset = async () => {
    setBusy(true);
    await new ResetLevelUseCase(repo).execute(USER_ID, level);
    setBusy(false);
    onReset();
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw /> Reiniciar nivel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar el nivel {level}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borrará tu progreso de escenarios en {level}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={busy}>
            Reiniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
