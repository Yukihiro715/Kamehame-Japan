import { assertSchema } from './schema.mjs';
import { publicUrl } from './core.mjs';

// Fixed endpoints, no executable content or provider URLs controlled by a model.
// No automatic retry: an ambiguous timeout may already have incurred a charge.
async function post(url, key, body, fetcher) {
  const response = await fetcher(url, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Provider request failed (${response.status}); no retry was attempted`);
  return response.json();
}
export function providers({ openaiKey, firecrawlKey, model, fetcher = fetch }) {
  if (!openaiKey || !firecrawlKey || !model) throw new Error('Set OPENAI_API_KEY, FIRECRAWL_API_KEY and OPENAI_MODEL');
  let scrapes = 0, completions = 0;
  return {
    async scrape(url) {
      if (!publicUrl(url) || ++scrapes > 3) throw new Error('Invalid source or scrape budget exceeded');
      const result = await post('https://api.firecrawl.dev/v2/scrape', firecrawlKey,
        { url, formats: ['markdown'], onlyMainContent: true, maxAge: 0 }, fetcher);
      const data = result.data;
      if (!result.success || !data?.markdown?.trim() || (data.metadata?.statusCode && data.metadata.statusCode !== 200)) throw new Error('Source unavailable; draft not generated');
      // Some sites retain a long global menu even with onlyMainContent.
      const heading = data.markdown.search(/^# /m);
      const main = heading >= 0 ? data.markdown.slice(heading) : data.markdown;
      return { title: data.metadata?.title || url, text: main.slice(0, 12000) };
    },
    async complete(name, schema, instructions, input) {
      if (++completions > 2 || JSON.stringify(input).length > 85000) throw new Error('Generation budget exceeded');
      const result = await post('https://api.openai.com/v1/responses', openaiKey, {
        model, store: false, instructions,
        input: [{ role: 'user', content: JSON.stringify(input) }],
        max_output_tokens: name === 'article_draft' ? 6000 : 3000,
        text: { format: { type: 'json_schema', name, strict: true, schema } },
      }, fetcher);
      if (result.status !== 'completed') throw new Error('Model output incomplete; no article saved');
      const parts = (result.output ?? []).flatMap((o) => o.content ?? []);
      if (parts.some((p) => p.type === 'refusal')) throw new Error('Model refused; no article saved');
      const value = JSON.parse(parts.filter((p) => p.type === 'output_text').map((p) => p.text).join(''));
      assertSchema(value, schema);
      return { value, usage: result.usage ?? {}, model: result.model ?? model };
    },
  };
}
