"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Heart, Mail, Star } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "failed";
const MAX_PHOTOS = 3;
/** Photos and videos together; videos up to 100 MB each (lib/review-media.ts). */
const MAX_FILES = 5;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const isVideo = (f: File) => f.type.startsWith("video/");
const isImage = (f: File) => f.type.startsWith("image/");
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-0000-4000-8000-000000000000`.padEnd(36, "0"));

/** One file into the MEDIA bucket, with progress; null when the store is not available (503) so the form can go on without it. */
function upload(file: File, id: string, n: number, onProgress: (ratio: number) => void): Promise<{ key: string; size: number; type: string } | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/review/upload?id=${encodeURIComponent(id)}&n=${n}&name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status === 503) return resolve(null);
      try { const j = JSON.parse(xhr.responseText) as { ok?: boolean; key?: string; size?: number; type?: string }; if (xhr.status === 200 && j.ok && j.key) return resolve({ key: j.key, size: j.size ?? file.size, type: j.type ?? file.type }); } catch { /* fall through */ }
      reject(new Error(`upload ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.send(file);
  });
}

/** Shrinks a photo in the browser so three of them still travel comfortably
 *  through one email; long side 1600px, JPEG. */
async function shrink(file: File): Promise<{ name: string; type: string; data: string } | null> {
  if (!file.type.startsWith("image/")) return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); return null; }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ n: number; total: number; ratio: number } | null>(null);
  const [mediaNote, setMediaNote] = useState<string | null>(null);
  const [uploadId] = useState(newId);

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
    setStatus("sending"); setMediaNote(null);
    try {
      // Photos travel with the email as before (shrunk); every file also goes to the media store when it is available.
      const images = files.filter(isImage).slice(0, MAX_PHOTOS);
      const converted = await Promise.all(images.map(shrink));
      if (converted.some((p) => !p || p.data.length > 2_500_000)) {
        setStatus("failed");
        return;
      }
      const photos = converted.filter((p): p is NonNullable<typeof p> => !!p);
      const media: { key: string; name: string; type: string; size: number }[] = [];
      let storeDown = false;
      for (const [i, f] of files.entries()) {
        if (storeDown) break;
        setProgress({ n: i + 1, total: files.length, ratio: 0 });
        try {
          const up = await upload(f, uploadId, i, (ratio) => setProgress({ n: i + 1, total: files.length, ratio }));
          if (!up) { storeDown = true; break; }
          media.push({ key: up.key, name: f.name, type: up.type, size: up.size });
        } catch { storeDown = true; }
      }
      setProgress(null);
      if (storeDown && files.some(isVideo)) setMediaNote(R.videoNotStored);
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, rating, experience, ref, lang, photos, uploadId, media, mediaConsent: data.mediaConsent === "yes" }),
      });
      const json = (await res.json()) as { ok: boolean };
      setStatus(res.ok && json.ok ? "sent" : "failed");
      if (res.ok && json.ok) track("review_sent", { experience, rating, language: lang });
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-done" role="status">
        <Check size={20} />
        <div><b>{R.sentTitle}</b><p>{R.sentBody}</p>{mediaNote && <p className="form-hint">{mediaNote}</p>}</div>
      </div>
    );
  }

  const current = experiences.find((x) => x.slug === experience);

  return (
    <form className="enquiry-form review-form" method="post" action="/api/review" onSubmit={submit} data-clarity-mask="True">
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
        <span>{R.body}</span>
        <textarea name="body" required rows={6} maxLength={2000} placeholder={R.bodyHint} />
      </label>
      <label className="form-row">
        <span>{R.name}</span>
        <input name="name" type="text" required autoComplete="given-name" maxLength={40} />
      </label>
      {/* Booking reference and experience come from the link in the thank-you email. */}
      <input type="hidden" name="ref" value={ref} />

      <label className="form-row">
        <span>{R.photos}</span>
        <input type="file" accept="image/*,video/*" multiple onChange={(e) => {
          const picked = [...(e.target.files ?? [])].filter((f) => isImage(f) || isVideo(f));
          const tooBig = picked.find((f) => (isVideo(f) ? f.size > MAX_VIDEO_BYTES : f.size > MAX_IMAGE_BYTES));
          setFileError(tooBig ? R.fileTooBig.replace("{name}", tooBig.name) : picked.length > MAX_FILES ? R.tooManyFiles : null);
          setFiles(picked.filter((f) => f !== tooBig).slice(0, MAX_FILES));
        }} />
        <small className="form-hint">{R.photosHint}</small>
        {files.length > 0 && <ul className="review-files">{files.map((f) => <li key={f.name + f.size}>{isVideo(f) ? "🎬" : "📷"} {f.name} <small>({(f.size / 1048576).toFixed(1)} MB)</small></li>)}</ul>}
        {fileError && <small className="form-hint form-hint-warn">{fileError}</small>}
        {progress && <small className="form-hint" role="status">{R.uploading.replace("{n}", String(progress.n)).replace("{total}", String(progress.total))} {Math.round(progress.ratio * 100)}%</small>}
      </label>

      <div className="review-help"><Heart size={16} /><p>{R.helpNote}</p></div>

      <label className="form-check form-consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span>{R.consent}</span>
      </label>
      <label className="form-check form-consent">
        <input type="checkbox" name="mediaConsent" value="yes" />
        <span>{R.mediaConsent}</span>
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
