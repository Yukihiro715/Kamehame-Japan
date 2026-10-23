"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";
import { composePhone, countryByIso, DEFAULT_BY_LANG, DIAL_COUNTRIES, formatPhone, isE164, PREFERRED_BY_LANG } from "@/lib/phone";

/** WhatsApp (or phone) field that always sends an international number.
 *  A country-code select sits beside the number; the form receives one
 *  hidden field, `name`, holding "+819012345678". Typing a number that
 *  starts with "+" overrides the select. Country names follow the page
 *  language through Intl.DisplayNames once the component has mounted. */

const T: Record<Lang, { country: string; number: string; pick: string; invalid: string; needCountry: string; sends: string }> = {
  en: { country: "Country code", number: "Number", pick: "Country code…", invalid: "Please check the number: digits only, with the country code.", needCountry: "Please choose the country code, or start the number with +.", sends: "Sends as" },
  ja: { country: "国番号", number: "番号", pick: "国番号を選択…", invalid: "番号をご確認ください(国番号付き、数字のみ)。", needCountry: "国番号を選ぶか、番号を + から入力してください。", sends: "送信される番号" },
  es: { country: "Prefijo de país", number: "Número", pick: "Prefijo de país…", invalid: "Revisa el número: solo dígitos, con el prefijo de país.", needCountry: "Elige el prefijo de país o empieza el número con +.", sends: "Se envía como" },
  fr: { country: "Indicatif du pays", number: "Numéro", pick: "Indicatif du pays…", invalid: "Vérifiez le numéro : chiffres uniquement, avec l'indicatif du pays.", needCountry: "Choisissez l'indicatif du pays ou commencez le numéro par +.", sends: "Envoyé sous la forme" },
  "zh-tw": { country: "國碼", number: "號碼", pick: "選擇國碼…", invalid: "請確認號碼：僅限數字，並含國碼。", needCountry: "請選擇國碼，或以 + 開頭輸入號碼。", sends: "送出的號碼" },
};

const LOCALE: Record<Lang, string> = { en: "en", ja: "ja", es: "es", fr: "fr", "zh-tw": "zh-Hant-TW" };

function englishNames(): Record<string, string> {
  return Object.fromEntries(DIAL_COUNTRIES.map((c) => [c.iso, c.name]));
}

const subscribeNoop = () => () => {};

function localizedNames(lang: Lang): Record<string, string> {
  try {
    const dn = new Intl.DisplayNames([LOCALE[lang]], { type: "region" });
    return Object.fromEntries(DIAL_COUNTRIES.map((c) => [c.iso, dn.of(c.iso) ?? c.name]));
  } catch {
    return englishNames();
  }
}

/** The browser's region (en-GB → "GB") when it is a country we list. */
function browserRegion(): string {
  const region = (typeof navigator !== "undefined" ? navigator.language || "" : "").split("-")[1]?.toUpperCase() ?? "";
  return region && countryByIso(region) ? region : "";
}

export function WhatsAppInput({ lang, name = "whatsapp", required, placeholder, ariaLabel }: { lang: Lang; name?: string; required?: boolean; placeholder?: string; ariaLabel?: string }) {
  const t = T[lang];
  // false during server rendering and hydration, true once mounted: country
  // names and the browser's region are only read on the client, after the
  // first paint, so the markup hydrates without mismatches.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [national, setNational] = useState("");
  const numberRef = useRef<HTMLInputElement>(null);
  const previewId = useId();

  const names = useMemo(() => (mounted ? localizedNames(lang) : englishNames()), [mounted, lang]);
  const guessed = useMemo(() => (mounted && !DEFAULT_BY_LANG[lang] ? browserRegion() : ""), [mounted, lang]);
  const iso = chosen ?? (DEFAULT_BY_LANG[lang] || guessed);

  const options = useMemo(() => {
    const preferred = (PREFERRED_BY_LANG[lang] ?? []).map(countryByIso).filter((c): c is NonNullable<typeof c> => !!c);
    const rest = DIAL_COUNTRIES.filter((c) => !preferred.includes(c)).sort((a, b) => (names[a.iso] ?? a.name).localeCompare(names[b.iso] ?? b.name, LOCALE[lang]));
    return { preferred, rest };
  }, [lang, names]);

  const typedPlus = national.trim().startsWith("+") || national.trim().startsWith("＋");
  const dial = typedPlus ? "" : countryByIso(iso)?.dial ?? "";
  const value = composePhone(dial, national);
  const hasInput = national.trim().length > 0;
  const valid = !hasInput || isE164(value);

  useEffect(() => {
    const el = numberRef.current;
    if (!el) return;
    if (!hasInput) el.setCustomValidity("");
    else if (!typedPlus && !iso) el.setCustomValidity(t.needCountry);
    else el.setCustomValidity(valid ? "" : t.invalid);
  }, [hasInput, typedPlus, iso, valid, t]);

  return (
    <div className={`wa-field${hasInput && !valid ? " wa-bad" : ""}`}>
      <select aria-label={t.country} value={typedPlus ? "" : iso} disabled={typedPlus} onChange={(e) => { setChosen(e.target.value); numberRef.current?.focus(); }}>
        <option value="">{t.pick}</option>
        {options.preferred.map((c) => <option key={c.iso} value={c.iso}>+{c.dial} {names[c.iso] ?? c.name}</option>)}
        {options.preferred.length > 0 && <option disabled>──────</option>}
        {options.rest.map((c) => <option key={c.iso} value={c.iso}>+{c.dial} {names[c.iso] ?? c.name}</option>)}
      </select>
      <input
        ref={numberRef} type="tel" inputMode="tel" autoComplete="tel" maxLength={25} required={required}
        aria-label={ariaLabel ?? t.number} aria-describedby={value ? previewId : undefined}
        placeholder={placeholder ?? t.number} value={national}
        onChange={(e) => setNational(e.target.value)}
      />
      <input type="hidden" name={name} value={valid ? value : national.trim()} />
      {hasInput && (
        <small id={previewId} className="wa-preview">
          {valid ? `${t.sends} ${formatPhone(value)}` : !typedPlus && !iso ? t.needCountry : t.invalid}
        </small>
      )}
    </div>
  );
}
