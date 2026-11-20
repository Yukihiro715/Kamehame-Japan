/** @param {unknown} value */
export function metricNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
/** Count one canonical Meta action, never sum aliases for the same outcome.
 * @param {any} row @param {'lead'|'purchase'} type @param {string[]|null} [droppedFields]
 */
export function metaConversions(row, type, droppedFields = []) {
  if (droppedFields?.includes('actions') || !Array.isArray(row.actions)) return null;
  const canonical = metricNumber(row.key_results?.[type]?.count);
  if (canonical !== null) return canonical;
  const aliases = type === 'lead' ? ['lead', 'onsite_web_lead', 'offsite_conversion.fb_pixel_lead'] : ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];
  for (const name of aliases) {
    const action = row.actions.find((/** @type {any} */ a) => a.action_type === name);
    if (action) return metricNumber(action.value);
  }
  return 0;
}
/** @param {any[]|undefined} rows @param {string} key */
export function sumMetric(rows, key) {
  if (!rows) return null;
  let total = 0;
  for (const row of rows) { const n = metricNumber(row[key]); if (n === null) return null; total += n; }
  return total;
}
/** @param {any} report */
export function organicConversions(report) {
  if (report.notConfigured || report.reauthRequired || report.truncated || !Array.isArray(report.rows) || !report.metrics?.includes('keyEvents')) throw new Error('自然検索CVを取得できませんでした');
  const row = report.rows.find((/** @type {any} */ r) => r.key === 'Organic Search');
  return {sessions: row ? metricNumber(row.sessions) : 0, conversions: row ? metricNumber(row.keyEvents) : 0, definition:'GA4 / Organic Search / キーイベント', timeZone:report.timeZone};
}
/** @param {string} today YYYY-MM-DD in the business timezone */
export function previousMonth(today) {
  const [year, month] = today.split('-').map(Number);
  return {start:new Date(Date.UTC(year,month-2,1)).toISOString().slice(0,10),end:new Date(Date.UTC(year,month-1,0)).toISOString().slice(0,10)};
}
