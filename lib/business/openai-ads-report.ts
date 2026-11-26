// Unix timestamps are start-inclusive and end-exclusive, in seconds.
export type OpenAiAdsReport = { currency: 'JPY' } & (
  | { coverage: 'complete' | 'partial'; spend: number; from: number; to: number }
  | { coverage: 'unavailable'; spend: null }
);

type SavedData = { currency?: string; spend?: number | null; coverage?: string };

export function openAiSpendForTotals(saved?: SavedData, current?: OpenAiAdsReport) {
  if (current && current.coverage !== 'complete') return null;
  return saved?.currency === 'JPY' && saved.coverage === 'complete' && typeof saved.spend === 'number'
    ? saved.spend : null;
}

export function openAiReportPeriod(from: number, to: number) {
  const shift = 9 * 60 * 60;
  const jst = (s: number) => new Date((s + shift) * 1000).toISOString();
  const start = jst(from);
  const end = jst(to);
  const startsAtMidnight = start.slice(11, 16) === '00:00';
  const endsAtMidnight = end.slice(11, 16) === '00:00';
  const startLabel = startsAtMidnight ? start.slice(0, 10) : start.slice(0, 16).replace('T', ' ');
  const endLabel = endsAtMidnight ? jst(to - 1).slice(0, 10) : end.slice(0, 16).replace('T', ' ');
  return (startLabel === endLabel ? startLabel : startLabel + '〜' + endLabel) + '（日本時間）';
}
