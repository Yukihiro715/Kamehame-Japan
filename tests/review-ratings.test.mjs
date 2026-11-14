import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { aggregateFor, ownAggregateFor, distributionFor, reviewsFor, ratingReviewsFor } = await vite.ssrLoadModule('/lib/published-reviews.ts');
const { productJsonLd } = await vite.ssrLoadModule('/lib/seo.ts');
const golf = 'mt-fuji-golf-day';

test('golf headline and structured rating count only the verified bookings', () => {
  assert.equal(reviewsFor(golf).length, 7);
  assert.deepEqual(aggregateFor(golf), { average: 5, count: 2 });
  assert.deepEqual(ownAggregateFor(golf), aggregateFor(golf));
  assert.deepEqual(ratingReviewsFor(golf).map(r => r.author), ['Neil', 'Tyler']);
  assert.equal(distributionFor(golf).reduce((n, d) => n + d.count, 0), 2);
  const schema = productJsonLd('Golf', 'Booking service', '/golf.webp', '/en/golf/', '¥15,000', golf);
  assert.equal(schema.aggregateRating.reviewCount, 2);
  assert.equal(schema.aggregateRating.ratingValue, 5);
});

test('partner group keeps its own rating and histogram', () => {
  assert.deepEqual(aggregateFor(golf, 'partner'), { average: 4.8, count: 5 });
  const dist = distributionFor(golf, 'partner');
  assert.equal(dist[0].count, 4);
  assert.equal(dist[1].count, 1);
  assert.ok(ratingReviewsFor(golf, 'partner').every(r => r.source === 'partner'));
});

test('unrelated partner-only experiences and unknown experiences retain their behavior', () => {
  assert.deepEqual(aggregateFor('kanji-name-calligraphy'), { average: 4.8, count: 5 });
  assert.equal(ownAggregateFor('kanji-name-calligraphy'), null);
  assert.equal(aggregateFor('unknown-experience'), null);
});
