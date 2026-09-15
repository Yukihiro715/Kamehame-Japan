"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { LANGS, type Lang } from "@/lib/i18n";

// Flag emoji don't render on Windows/Chrome, so flags are tiny inline SVGs.
function FlagEN() {
  return (
    <svg className="flag" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="18" height="13" fill="#B22234" />
      <rect y="1.86" width="18" height="1.86" fill="#fff" />
      <rect y="5.57" width="18" height="1.86" fill="#fff" />
      <rect y="9.29" width="18" height="1.86" fill="#fff" />
      <rect width="7.6" height="5.57" fill="#3C3B6E" />
    </svg>
  );
}
function FlagFR() {
  return (
    <svg className="flag" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="6" height="13" fill="#002395" />
      <rect x="6" width="6" height="13" fill="#fff" />
      <rect x="12" width="6" height="13" fill="#ED2939" />
    </svg>
  );
}
function FlagES() {
  return (
    <svg className="flag" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="18" height="13" fill="#AA151B" />
      <rect y="3.25" width="18" height="6.5" fill="#F1BF00" />
    </svg>
  );
}
function FlagTW() {
  return (
    <svg className="flag" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="18" height="13" fill="#FE0000" />
      <rect width="9" height="6.5" fill="#000095" />
      <circle cx="4.5" cy="3.25" r="1.9" fill="#fff" />
    </svg>
  );
}

function FlagJA() {
  return (
    <svg className="flag" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="18" height="13" fill="#fff" />
      <circle cx="9" cy="6.5" r="3.6" fill="#BC002D" />
    </svg>
  );
}

export const LOCALES = [
  { code: "en", short: "EN", label: "English", Flag: FlagEN, available: true },
  { code: "es", short: "ES", label: "Español", Flag: FlagES, available: true },
  { code: "ja", short: "日本語", label: "日本語", Flag: FlagJA, available: true },
  { code: "fr", short: "FR", label: "Français", Flag: FlagFR, available: false },
  { code: "zh-tw", short: "繁中", label: "繁體中文", Flag: FlagTW, available: false },
] as const;

// Maps the current pathname to its equivalent in another published language.
function pathFor(target: Lang): string {
  let path = typeof window === "undefined" ? "/" : window.location.pathname;
  for (const l of LANGS) {
    if (path === `/${l}` || path === `/${l}/`) { path = "/"; break; }
    if (path.startsWith(`/${l}/`)) { path = path.slice(l.length + 1); break; }
  }
  if (path.startsWith("/partners")) return path; // Japanese-only page
  return path === "/" ? (target === "en" ? "/" : `/${target}/`) : `/${target}${path}`;
}

function switchTo(code: string) {
  window.location.href = pathFor(code as Lang);
}

// Header dropdown: globe icon + current language. Unpublished languages are
// listed with a SOON tag instead of pretending to switch.
export function LanguageSwitcher({ lang = "en" }: { lang?: Lang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const current = LOCALES.find((l) => l.code === lang) ?? LOCALES[0];

  return (
    <div className="lang-switch" ref={ref}>
      <button
        type="button"
        className="language-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}. Change language`}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe2 size={16} /> {current.short} <ChevronDown size={13} className={open ? "flip" : ""} />
      </button>
      {open && (
        <div className="lang-menu" role="listbox" aria-label="Site language">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === current.code}
              aria-disabled={!l.available}
              className={`lang-item ${l.code === current.code ? "active" : ""}`}
              onClick={() => {
                if (!l.available) return;
                setOpen(false);
                if (l.code !== current.code) switchTo(l.code);
              }}
            >
              <l.Flag />
              <span>{l.label}</span>
              {l.code === current.code && <Check size={14} className="lang-check" />}
              {!l.available && <span className="soon">Soon</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Footer row: flag + short-code chips; published languages are links.
export function FooterLanguages({ lang = "en" }: { lang?: Lang }) {
  return (
    <div className="footer-langs" aria-label="Site language">
      {LOCALES.map((l) => {
        if (!l.available) {
          return (
            <span key={l.code} className="footer-lang" aria-disabled="true">
              <l.Flag />{l.short}<span className="soon">Soon</span>
            </span>
          );
        }
        return (
          <button
            key={l.code}
            type="button"
            className={`footer-lang available ${l.code === lang ? "active" : ""}`}
            onClick={() => { if (l.code !== lang) switchTo(l.code); }}
          >
            <l.Flag />{l.short}
          </button>
        );
      })}
    </div>
  );
}
