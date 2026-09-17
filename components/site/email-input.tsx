"use client";

import { useId, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";

/** Email field with two kinds of completion: the browser's own contact
 *  autofill (type, name, autocomplete and inputmode are all set for it) and,
 *  once an "@" is typed, a short list of common mail domains to tap. The
 *  list never blocks typing an address it does not know. */

const COMMON = ["gmail.com", "icloud.com", "yahoo.com", "outlook.com", "hotmail.com", "me.com", "live.com", "aol.com", "msn.com", "proton.me", "protonmail.com"];
const BY_LANG: Record<Lang, string[]> = {
  en: ["gmail.com", "icloud.com", "yahoo.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "yahoo.co.uk", "btinternet.com", "yahoo.com.au", "bigpond.com"],
  es: ["gmail.com", "hotmail.com", "hotmail.es", "yahoo.es", "outlook.com", "outlook.es", "icloud.com", "telefonica.net"],
  ja: ["gmail.com", "icloud.com", "yahoo.co.jp", "outlook.jp", "outlook.com", "hotmail.co.jp", "docomo.ne.jp", "ezweb.ne.jp", "softbank.ne.jp"],
  fr: ["gmail.com", "orange.fr", "hotmail.fr", "outlook.fr", "icloud.com", "free.fr", "wanadoo.fr", "laposte.net", "sfr.fr", "yahoo.fr"],
  "zh-tw": ["gmail.com", "yahoo.com.tw", "hotmail.com", "outlook.com", "icloud.com", "hinet.net", "msa.hinet.net", "pchome.com.tw"],
};

function suggestionsFor(value: string, lang: Lang): string[] {
  const at = value.indexOf("@");
  if (at < 1) return [];
  const local = value.slice(0, at);
  const typed = value.slice(at + 1).toLowerCase();
  if (typed.includes("@")) return [];
  const ordered = [...new Set([...BY_LANG[lang], ...COMMON])];
  return ordered
    .filter((d) => d.startsWith(typed) && d !== typed)
    .slice(0, 5)
    .map((d) => `${local}@${d}`);
}

export function EmailInput({ lang, name = "email", required, maxLength = 200 }: { lang: Lang; name?: string; required?: boolean; maxLength?: number }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  const items = open ? suggestionsFor(value, lang) : [];
  const apply = (v: string) => { setValue(v); setOpen(false); setActive(-1); input.current?.focus(); };

  return (
    <div className="email-field">
      <input
        ref={input} name={name} type="email" required={required} maxLength={maxLength}
        autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next"
        value={value}
        aria-controls={items.length ? listId : undefined} aria-expanded={items.length > 0}
        onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % items.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); apply(items[active]); }
          else if (e.key === "Escape") { setOpen(false); setActive(-1); }
          else if (e.key === "Tab") setOpen(false);
        }}
      />
      {items.length > 0 && (
        // pointerdown is prevented so choosing an entry does not blur the input
        // first (which would close the list before the click lands).
        <ul className="email-suggest" id={listId} role="listbox" onPointerDown={(e) => e.preventDefault()}>
          {items.map((v, i) => (
            <li key={v} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? "active" : ""} onClick={(e) => { e.preventDefault(); apply(v); }}>{v}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
