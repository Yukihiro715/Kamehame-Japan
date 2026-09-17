"use client";

import { Minus, Plus } from "lucide-react";

/** A − / + head-count control. `value` is the number as a string (the
 *  booking state keeps it that way); counts above `listedMax` are still
 *  allowed so large groups can say exactly how many they are. */
export function GuestStepper({ id, value, min, max, onChange, label, decLabel, incLabel }: {
  id?: string;
  value: string;
  min: number;
  max: number;
  onChange: (next: string) => void;
  label: (n: number) => string;
  decLabel: string;
  incLabel: string;
}) {
  const n = Math.min(max, Math.max(min, Number(value) || min));
  return (
    <div className="stepper" role="group" id={id}>
      <button type="button" onClick={() => onChange(String(n - 1))} disabled={n <= min} aria-label={decLabel}><Minus size={16} /></button>
      <output aria-live="polite">{label(n)}</output>
      <button type="button" onClick={() => onChange(String(n + 1))} disabled={n >= max} aria-label={incLabel}><Plus size={16} /></button>
    </div>
  );
}
