import { z } from 'zod';
import { ApiError } from '@/lib/portal/util';
import { read, type AdsEnv } from './ad-sources';

const base = 'https://api.ads.openai.com/v1/ad_account';
const label = 'ChatGPT広告';
const accountResponse = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  currency_code: z.string(),
  timezone: z.string(),
});
const insightsResponse = z.object({
  object: z.literal('list'),
  has_more: z.literal(false),
  data: z.array(z.object({
    ad_account_id: z.string(),
    start_time: z.number().int(),
    end_time: z.number().int(),
    spend: z.number().finite().nonnegative().nullish(),
  })).max(1),
});

export async function openAiAds(env: AdsEnv, start: string, end: string) {
  const headers = { Authorization: 'Bearer ' + env.OPENAI_ADS_API_KEY };
  const account = accountResponse.safeParse(await read<unknown>(base, { headers }, label));
  if (!account.success) throw new ApiError(502, 'invalid_report', 'ChatGPT広告アカウントの情報を取得できませんでした。');
  if (new URL(account.data.url).origin !== 'https://kamehame-japan.com') {
    throw new ApiError(422, 'wrong_account', 'KAMEHAME JAPANのChatGPT広告アカウントのAPIキーを設定してください。');
  }
  if (account.data.currency_code !== 'JPY' || account.data.timezone !== 'Asia/Tokyo') {
    throw new ApiError(422, 'account_settings_mismatch', 'ChatGPT広告の通貨とタイムゾーンはJPY / Asia/Tokyoである必要があります。');
  }

  const from = Date.parse(start + 'T00:00:00+09:00') / 1000;
  const endExclusive = Date.parse(end + 'T00:00:00+09:00') / 1000 + 86400;
  const to = Math.min(endExclusive, Math.floor(Date.now() / 3600000) * 3600);
  if (to <= from) return { currency: 'JPY', spend: null };

  const params = new URLSearchParams({ aggregation_level: 'ad_account', time_granularity: 'none' });
  params.append('fields[]', 'ad_account.id');
  params.append('fields[]', 'ad_account.spend');
  params.append('time_ranges[]', JSON.stringify({ type: 'unix_range', start: from, end: to }));
  const report = insightsResponse.safeParse(await read<unknown>(base + '/insights?' + params, { headers }, label));
  if (!report.success) throw invalidReport();
  const row = report.data.data[0];
  // A partial bucket would understate spend when saved for the full request.
  if (row && (row.ad_account_id !== account.data.id || row.start_time !== from || row.end_time !== to)) {
    throw invalidReport();
  }
  return { currency: 'JPY', spend: row?.spend ?? null };
}

function invalidReport() {
  return new ApiError(502, 'invalid_report', 'ChatGPT広告費を指定期間で取得できませんでした。保存済みデータを保持しています。');
}
