import type { Experience } from '@/lib/catalog';
import type { Lang } from '@/lib/i18n';
import { accessFor, accessCopy, directionsUrl, placeName, type AccessRoute } from '@/lib/experience-access';
import styles from './experience-access.module.css';

/** Server-rendered text: access remains readable without JS or opening a map. */
export function ExperienceAccess({ exp, lang }: { exp: Experience; lang: Lang }) {
  const access = accessFor(exp.slug);
  if (!access || exp.category === 'golf') return null;
  const c = accessCopy[lang];
  const table = (routes: AccessRoute[], heading: string) => (
    <div className={styles.group}>
      <h3>{heading}</h3>
      <table>
        <thead><tr><th scope="col">{c.from}</th><th scope="col">{c.route}</th></tr></thead>
        <tbody>{routes.map((r) => <tr key={r.place.en}>
          <th scope="row">{placeName(r.place, lang)}</th>
          <td>{access.destination ? <>
            <span className={styles.method}>{r.direct ? c.direct : c[r.mode]}{r.minutes ? ` · ${c.about} ${r.minutes} ${c.minutes}` : ''}</span>
            <a href={directionsUrl(r.place, access.destination, r.mode)} target="_blank" rel="noopener noreferrer" aria-label={`${placeName(r.place, lang)} → ${placeName(access.destination, lang)}: ${c.check}`}>{c.check}<span aria-hidden="true"> ↗</span></a>
          </> : <span>{c.pending}</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
  return <section className={`xp-section ${styles.access}`} id="access" aria-labelledby="experience-access-heading">
    <h2 id="experience-access-heading">{c.heading}</h2>
    <p className="xp-note">{c[access.scope]}</p>
    {access.destination && <p className={styles.destination}><strong>{c.destination}:</strong> {placeName(access.destination, lang)}</p>}
    {access.scope === 'area' && exp.venue?.known[0] && <div className={styles.lastLeg}><h3>{c.lastLeg}</h3><p>{exp.venue.known[0]}</p></div>}
    {table(access.stations, c.stations)}
    {table(access.hotels, c.hotels)}
    {access.nearby && <p className={styles.nearby}><strong>{c.nearby}:</strong> {placeName(access.nearby, lang)}</p>}
    <p className={styles.note}>{c.note}</p>
  </section>;
}
