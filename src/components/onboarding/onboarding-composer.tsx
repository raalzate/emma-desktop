"use client";

/**
 * Entrada única del onboarding, anclada al pie. Enter envía; escribir "skip"
 * salta los pasos opcionales (el motor decide si el paso es saltable). Se
 * deshabilita mientras Emma "piensa" para forzar el flujo por turnos.
 */

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function OnboardingComposer({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");

  // Envía el texto recortado; ignora vacío o envío mientras está deshabilitado.
  const send = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Emma está escribiendo…" : 'Escribe tu respuesta (o "skip")…'}
        aria-label="Tu respuesta"
      />
      <Button
        type="button"
        size="icon"
        onClick={send}
        disabled={disabled || !value.trim()}
        aria-label="Enviar"
      >
        <Send />
      </Button>
    </div>
  );
}
