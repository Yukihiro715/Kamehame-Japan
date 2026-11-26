"use client";
import { useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, ja } from "react-day-picker/locale";
import { CalendarDays } from "lucide-react";
import { Button } from "../ui";

const localDate = (v: string) => new Date(v + "T12:00:00");
const dateValue = (v: Date) =>
  [
    v.getFullYear(),
    String(v.getMonth() + 1).padStart(2, "0"),
    String(v.getDate()).padStart(2, "0"),
  ].join("-");
export function CaseDate({
  label,
  values,
  onChange,
  en,
  multiple = false,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  en: boolean;
  multiple?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const display = new Intl.DateTimeFormat(en ? "en-US" : "ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const dates = values.map(localDate);
  const common = {
    locale: en ? enUS : ja,
    defaultMonth: dates[0] ?? localDate(today),
    disabled: { before: localDate(today) },
    showOutsideDays: true,
    fixedWeeks: true,
    autoFocus: true,
  };
  return (
    <div className="pt-date-field">
      <span className="pt-field-l">{label}</span>
      <button
        type="button"
        className="pt-btn pt-btn-secondary"
        ref={trigger}
        aria-label={
          label +
          (dates.length
            ? ": " + dates.map((d) => display.format(d)).join(" · ")
            : "")
        }
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <CalendarDays size={17} />
        {dates.length
          ? dates.map((d) => display.format(d)).join(" · ")
          : en
            ? "Choose a date"
            : "カレンダーで選択"}
      </button>
      {open && (
        <div className="pt-case-calendar" aria-label={label}>
          {multiple ? (
            <DayPicker
              {...common}
              mode="multiple"
              max={5}
              selected={dates}
              onSelect={(v) => onChange((v ?? []).map(dateValue).sort())}
            />
          ) : (
            <DayPicker
              {...common}
              mode="single"
              selected={dates[0]}
              onSelect={(v) => {
                onChange(v ? [dateValue(v)] : []);
                close();
              }}
            />
          )}
          <div className="pt-row">
            <Button kind="link" onClick={() => onChange([])}>
              {en ? "Clear" : "選択を解除"}
            </Button>
            <Button kind="secondary" onClick={close}>
              {en ? "Done" : "完了"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
