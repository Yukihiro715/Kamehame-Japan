"use client";
import { DIAL_COUNTRIES } from "@/lib/phone";

export function Nationality({
  value,
  onChange,
  en,
}: {
  value: string;
  onChange: (v: string) => void;
  en: boolean;
}) {
  const locale = en ? "en" : "ja",
    regions = new Intl.DisplayNames([locale], { type: "region" });
  const options = Array.from(new Set(DIAL_COUNTRIES.map((c) => c.iso)))
    .map((code) => [code, regions.of(code) ?? code])
    .sort((a, b) => a[1].localeCompare(b[1], locale));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{en ? "Select nationality" : "国籍を選択"}</option>
      {value && !options.some(([code]) => code === value) && (
        <option value={value}>{value}</option>
      )}
      {options.map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}
