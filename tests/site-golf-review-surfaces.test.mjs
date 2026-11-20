import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, ws: false } });
after(() => vite.close());
const { isSiteGolfReviewPage, SITE_GOLF_REVIEW_ID } = await vite.ssrLoadModule('/lib/site-reviewed-golf.ts');
const { verifiedGolfAggregate, withPrivateGolfRating } = await vite.ssrLoadModule('/lib/site-golf-reviews-context.ts');
const { ownReviewsFor } = await vite.ssrLoadModule('/lib/published-reviews.ts');
const { getCollection, collectionSlugs } = await vite.ssrLoadModule('/lib/collections.ts');
const { experienceJsonLd } = await vite.ssrLoadModule('/lib/experience-seo.ts');
const { catalogFor } = await vite.ssrLoadModule('/lib/catalog.ts');
const { golfLandingSlides } = await vite.ssrLoadModule('/components/site/golf-landing-reviews.tsx');
const host = 'kamehame-japan.com';
const slug = 'mt-fuji-golf-day';
const locale = 'en';
const photo = '/media/example/1.webp';
const reviewed = {
  id: SITE_GOLF_REVIEW_ID, author: 'Example Guest', rating: 5, country: '', source: 'direct',
  experience: slug, verified: true, date: '2099-02-01', body: 'Exact first paragraph.\n\nSecond paragraph.',
  photos: [photo, '/media/example/2.webp'],
};
const existing = ownReviewsFor(slug);
const aggregate = verifiedGolfAggregate([reviewed, ...existing]);

test('Sports & Outdoors and every Explore listing with this private product use the resolved rating', () => {
  assert.equal(isSiteGolfReviewPage(host, '/en/sports/'), true);
  for (const lang of ['en', 'ja', 'es', 'fr', 'zh-tw']) {
    const relevant = collectionSlugs.filter(c => getCollection(c, lang)?.items.some(item => item.slug === slug));
    assert.ok(relevant.includes('sports'));
    for (const c of relevant) assert.equal(isSiteGolfReviewPage(host, `/${lang}/${c}/`), true);
  }
  const item = getCollection('sports', locale).items.find(i => i.slug === slug);
  assert.deepEqual(withPrivateGolfRating(item, aggregate).rating, { average: 5, count: 2 });
  assert.deepEqual(withPrivateGolfRating(item, verifiedGolfAggregate(existing)).rating, { average: 5, count: 1 });
  assert.strictEqual(withPrivateGolfRating({ slug: 'golf-bus', rating: { average: 5, count: 1 } }, aggregate).rating.count, 1);
  assert.equal(isSiteGolfReviewPage(host, '/en/sports/', 'staging'), false);
  assert.equal(isSiteGolfReviewPage('preview.example', '/en/sports/'), false);
});

test('Private-product JSON-LD uses the visible count from verified reviews only', () => {
  const mixed = [reviewed, ...existing, ...ownReviewsFor('golf-bus'), { ...reviewed, source: 'partner' }];
  assert.deepEqual(verifiedGolfAggregate(mixed), { average: 5, count: 2 });
  const exp = catalogFor(locale).experiences.find(e => e.slug === slug);
  const [entity] = experienceJsonLd(exp, locale, [], aggregate)['@graph'];
  assert.equal(entity.aggregateRating.reviewCount, 2);
  assert.equal(entity.aggregateRating.ratingValue, 5);
});

test('The golf-tours carousel presents the new private review first; the separate bus review stays last', () => {
  assert.equal(isSiteGolfReviewPage(host, '/en/golf-tours/'), true);
  const slides = golfLandingSlides(locale, [reviewed, ...existing]);
  assert.equal(slides.length, 3);
  assert.equal(slides[0].author, reviewed.author);
  assert.equal(slides[0].photo, '/media/example/1-600.webp');
  assert.equal(slides[0].excerpt, 'Exact first paragraph.');
  assert.match(slides[0].href, /mt-fuji-golf-day\/#verified-round-/);
  assert.equal(slides[0].service, slides[1].service);
  assert.notEqual(slides[0].service, slides[2].service);
  assert.match(slides[2].href, /golf-bus\/#reviews$/);
});
