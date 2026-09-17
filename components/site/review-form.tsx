"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail, Star } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { EmailInput } from "@/components/site/email-input";

type Status = "idle" | "sending" | "sent" | "failed";
const MAX_PHOTOS = 3;

/** Shrinks a photo in the browser so three of them still travel comfortably
 *  through one email; long side 1600px, JPEG. */
async function shrink(file: File): Promise<{ name: string; type: string; data: string } | null> {
  if (!file.type.startsWith("image/")) return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", data: dataUrl.split(",")[1] };
}

export function ReviewForm({ lang, experiences, fallbackEmail }: { lang: Lang; experiences: { slug: string; title: string }[]; fallbackEmail: string }) {
  const R = t(lang).reviewForm;
  const [status, setStatus] = useState<Status>("idle");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [experience, setExperience] = useState(experiences[0]?.slug ?? "");
  const [ref, setRef] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // The thank-you email links here with ?experience=…&ref=… so the guest
  // does not have to type either.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const e = q.get("experience"); const r = q.get("ref");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after mount
    if (e && experiences.some((x) => x.slug === e)) setExperience(e);
    if (r) setRef(r.slice(0, 40));
  }, [experiences]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    try {
      const photos = (await Promise.all(files.slice(0, MAX_PHOTOS).map(shrink))).filter((p): p is NonNullable<typeof p> => !!p);
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, rating, experience, ref, lang, photos }),
      });
      const json = (await res.json()) as { ok: boolean };
      setStatus(json.ok ? "sent" : "failed");
      if (json.ok) track("review_sent", { experience, rating, language: lang });
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-done" role="status">
        <Check size={20} />
        <div><b>{R.sentTitle}</b><p>{R.sentBody}</p></div>
      </div>
    );
  }

  const current = experiences.find((x) => x.slug === experience);

  return (
    <form className="enquiry-form review-form" onSubmit={submit}>
      {experiences.length > 1 ? (
        <label className="form-row">
          <span>{R.about}</span>
          <select value={experience} onChange={(e) => setExperience(e.target.value)}>
            {experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}
          </select>
        </label>
      ) : (
        <p className="form-context"><span>{R.about}</span> <b>{current?.title}</b></p>
      )}

      <div className="form-row">
        <span id="rating-label">{R.rating}</span>
        <div className="rating-input" role="radiogroup" aria-labelledby="rating-label">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} — ${R.ratingOpts[n - 1]}`}
              className={n <= (hover || rating) ? "on" : ""}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
            ><Star size={30} /></button>
          ))}
          <em>{(hover || rating) ? R.ratingOpts[(hover || rating) - 1] : ""}</em>
        </div>
      </div>

      <label className="form-row">
        <span>{R.title}</span>
        <input name="title" type="text" maxLength={90} />
      </label>
      <label className="form-row">
        <span>{R.body}</span>
        <textarea name="body" required rows={6} maxLength={2000} placeholder={R.bodyHint} />
      </label>

      <div className="form-row two">
        <label>
          <span>{R.name}</span>
          <input name="name" type="text" required autoComplete="given-name" maxLength={40} />
        </label>
        <label>
          <span>{R.country}</span>
          <input name="country" type="text" required autoComplete="country-name" placeholder={R.countryHint} maxLength={60} />
        </label>
      </div>
      <div className="form-row two">
        <label>
          <span>{R.email}</span>
          <EmailInput lang={lang} required />
        </label>
        <label>
          <span>{R.party}</span>
          <select name="party" defaultValue="couple">
            {Object.entries(R.partyOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <div className="form-row two">
        <label>
          <span>{R.date}</span>
          <input name="date" type="date" />
        </label>
        <label>
          <span>{R.ref}</span>
          <input name="ref" type="text" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={40} />
        </label>
      </div>

      <label className="form-row">
        <span>{R.photos}</span>
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, MAX_PHOTOS))} />
        <small className="form-hint">{R.photosHint}</small>
      </label>

      <label className="form-check form-consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span>{R.consent}</span>
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className="contact-cta" disabled={status === "sending" || !rating}>
          {status === "sending" ? R.sending : R.send} <ArrowRight size={15} />
        </button>
      </div>
      {status === "failed" && (
        <p className="form-error" role="alert"><Mail size={14} /> {R.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a></p>
      )}
    </form>
  );
}
