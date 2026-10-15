"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useCurrency } from "@/components/site/currency-context";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { t, type Lang } from "@/lib/i18n";

const SHORT: Record<Currency, string> = { USD: "USD $", JPY: "JPY ¥" };

/** Header dropdown beside the language switcher: the display currency.
 *  Changing it re-renders prices in place; nothing navigates or resets. */
export function CurrencySwitcher({ lang = "en" }: { lang?: Lang }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const F = t(lang).fx;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const names: Record<Currency, string> = { USD: F.usd, JPY: F.jpy };

  return (
    <div className="lang-switch currency-switch" ref={ref}>
      <button
        type="button"
        className="language-button currency-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${F.label}: ${names[currency]}. ${F.change}`}
        onClick={() => setOpen((v) => !v)}
      >
        {SHORT[currency]} <ChevronDown size={13} className={open ? "flip" : ""} />
      </button>
      {open && (
        <div className="lang-menu currency-menu" role="listbox" aria-label={F.label}>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={c === currency}
              className={`lang-item ${c === currency ? "active" : ""}`}
              onClick={() => { setOpen(false); if (c !== currency) setCurrency(c); }}
            >
              <span className="currency-code">{c}</span>
              <span className="currency-name">— {names[c]}</span>
              {c === currency && <Check size={14} className="lang-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
