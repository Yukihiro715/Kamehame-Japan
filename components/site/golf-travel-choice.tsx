"use client";

import Link from "next/link";
import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { useBooking } from "./booking-context";
import { Fx } from "./money";
import { track } from "@/lib/analytics";
import { golfProcessCopy } from "@/lib/golf-booking-copy";
import type { Lang } from "@/lib/i18n";
import { FUJI_TRANSFER_JPY, SHARED_BUS_BUDGET_JPY, GOLF_TRAVEL_COPY, GOLF_TRAVEL_UI, golfBusHref, travelRange, type GolfTransferChoice } from "@/lib/golf-travel";
import styles from "./golf-travel-choice.module.css";

const fill = (text: string, n: number, price: string) => {
  const result = text.replace("{n}", String(n)).replace("{price}", price);
  return n === 1 ? result.replace("1 golfers", "1 golfer").replace("1 jugadores", "1 jugador").replace("1 joueurs", "1 joueur") : result;
};

export function FujiTransferEstimate({ lang, golfers, compact = false }: { lang: Lang; golfers: number; compact?: boolean }) {
  const C = GOLF_TRAVEL_COPY[lang];
  const range = travelRange(FUJI_TRANSFER_JPY.min, FUJI_TRANSFER_JPY.max);
  return <div className={compact ? styles.summary : styles.estimate} data-fuji-transfer-estimate>
    {!compact && <h3 className={styles.title}>{C.privateTitle}</h3>}
    <p className={styles.text}>{C.route}</p>
    <p className={compact ? styles.text : styles.price}><strong><Fx>{range}</Fx></strong></p>
    <p className={styles.text}>{C.vehicle}{!compact && ` · ${C.includes}`}</p>
    {golfers <= 4 && <p className={styles.split}><Fx>{fill(C.perGolfer, golfers, travelRange(FUJI_TRANSFER_JPY.min / golfers, FUJI_TRANSFER_JPY.max / golfers))}</Fx></p>}
    <p className={styles.note}>{C.excludes}</p>
    {compact ? <details className={styles.details}><summary>{GOLF_TRAVEL_UI[lang].details}</summary><p className={styles.note}>{C.includes} {C.quote}</p></details> : <p className={styles.note}>{C.quote}</p>}
  </div>;
}

export function SharedBusBudget({ lang, golfers = 2, date = "", transfer = "unsure", link = true, compact = false }: { lang: Lang; golfers?: number; date?: string; transfer?: GolfTransferChoice; link?: boolean; compact?: boolean }) {
  const C = GOLF_TRAVEL_COPY[lang];
  return <div className={`${styles.bus}${compact ? ` ${styles.compact}` : ""}`} data-shared-bus-budget>
    <span className={styles.tag}>{compact ? GOLF_TRAVEL_UI[lang].bus : C.busTag}</span>
    {!compact && <h3 className={styles.title}>{C.busTitle}</h3>}
    <p className={styles.price}><Fx>{fill(C.busPrice, golfers, travelRange(SHARED_BUS_BUDGET_JPY.min, SHARED_BUS_BUDGET_JPY.max))}</Fx></p>
    <p className={styles.text}><strong>{C.busIncludes}</strong></p>
    <p className={compact ? styles.text : styles.split}><Fx>{fill(C.busTotal, golfers, travelRange(SHARED_BUS_BUDGET_JPY.min * golfers, SHARED_BUS_BUDGET_JPY.max * golfers))}</Fx></p>
    {compact ? <>
      <p className={styles.note}>{GOLF_TRAVEL_UI[lang].busArea}</p>
      <details className={styles.details}><summary>{GOLF_TRAVEL_UI[lang].details}</summary><p className={styles.note}><Fx>{C.busExtras}</Fx></p><p className={styles.note}>{C.busArea}</p></details>
    </> : <><p className={styles.note}><Fx>{C.busExtras}</Fx></p><p className={styles.note}>{C.busArea}</p></>}
    {link && <Link className={styles.cta} href={golfBusHref(lang, golfers, date, transfer)} onClick={() => track("golf_bus_alternative_clicked", { golfers, date: date || undefined, area: "fuji", transfer, language: lang })}>{C.busCta}<ArrowRight size={16} aria-hidden="true" /></Link>}
  </div>;
}

/** Shared state keeps the top panel, form and pre-submit summary consistent. */
export function GolfTravelChoice({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const b = useBooking();
  const id = useId();
  if (!b) return null;
  const C = GOLF_TRAVEL_COPY[lang];
  const fuji = b.variant === "fuji";
  return <div className={styles.choice}>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{C.heading}</legend>
      {compact ? <select className={styles.select} aria-label={C.heading} value={b.golfTransfer} onChange={e => b.set({ golfTransfer: e.target.value as GolfTransferChoice })}>{(["introduce", "none", "unsure"] as const).map(value => <option key={value} value={value}>{C.choices[value]}</option>)}</select> : <div className={styles.radios}>{(["introduce", "none", "unsure"] as const).map(value => <label className={styles.option} key={value}>
        <input type="radio" name={`golf-travel-${id}`} value={value} checked={b.golfTransfer === value} onChange={() => b.set({ golfTransfer: value })} />
        <span>{C.choices[value]}</span>
      </label>)}</div>}
    </fieldset>
    {fuji && b.golfTransfer !== "none" && <div aria-live="polite">
      <FujiTransferEstimate lang={lang} golfers={b.guestsNumber} compact={compact} />
      {b.guestsNumber <= 2 && <SharedBusBudget lang={lang} golfers={b.guestsNumber} date={b.date} transfer={b.golfTransfer} compact={compact} />}
    </div>}
    {fuji && b.golfTransfer === "none" && <p className={styles.note}>{C.self}</p>}
    {!fuji && b.golfTransfer !== "none" && <p className={styles.note}>{golfProcessCopy(lang).transferNote}</p>}
  </div>;
}

/** A consistent, clearly labelled comparison replacing the old four-person estimate. */
export function GolfTravelComparison({ lang }: { lang: Lang }) {
  const C = GOLF_TRAVEL_COPY[lang];
  return <div className={styles.comparison}>
    <h2>{C.compareTitle}</h2>
    <FujiTransferEstimate lang={lang} golfers={2} />
    <SharedBusBudget lang={lang} golfers={2} />
  </div>;
}
