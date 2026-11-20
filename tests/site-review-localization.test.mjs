import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, ws: false } });
after(() => vite.close());
const { openSiteReviewLocalizations } = await vite.ssrLoadModule('/lib/site-review-localization.ts');
const { golfReviewTranslationFor } = await vite.ssrLoadModule('/lib/review-translations.ts');
const { golfLandingSlides } = await vite.ssrLoadModule('/components/site/golf-landing-reviews.tsx');

const locator = 'reviews/2099-01/11111111-2222-4333-8444-555555555555/meta.json';
const bodyDigest = 'example-approved-body-digest';
const fake = {
  ja: '合成一。\n\n合成二。\n\n合成三。',
  es: 'Párrafo de ejemplo.\n\nSegundo párrafo.\n\nTercer párrafo.',
  fr: 'Paragraphe d’exemple.\n\nDeuxième paragraphe.\n\nTroisième paragraphe.',
  'zh-tw': '範例一。\n\n範例二。\n\n範例三。',
};
const seal = (copy) => {
  const domain = 'kamehame/review-localization/v1';
  const key = createHash('sha256').update(domain + '\0' + locator).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(domain + '\0' + bodyDigest));
  return { iv: iv.toString('base64'), ciphertext: Buffer.concat([cipher.update(JSON.stringify(copy)), cipher.final(), cipher.getAuthTag()]).toString('base64') };
};

test('review localization authenticates the private record and approved original independently', async () => {
  const envelope = seal(fake);
  const expected = Object.fromEntries(Object.entries(fake).map(([lang, body]) => [lang, { body }]));
  assert.deepEqual(await openSiteReviewLocalizations(envelope, locator, bodyDigest), expected);
  assert.equal(await openSiteReviewLocalizations(envelope, locator + ':other', bodyDigest), undefined);
  assert.equal(await openSiteReviewLocalizations(envelope, locator, bodyDigest + ':other'), undefined);
  const tampered = Buffer.from(envelope.ciphertext, 'base64');
  tampered[0] ^= 1;
  assert.equal(await openSiteReviewLocalizations({ ...envelope, ciphertext: tampered.toString('base64') }, locator, bodyDigest), undefined);
  assert.equal(await openSiteReviewLocalizations(seal({ ...fake, extra: 'another field' }), locator, bodyDigest), undefined);
});

test('detail uses the full localized copy and landing shows its first paragraph without replacing English source', async () => {
  const i18n = await openSiteReviewLocalizations(seal(fake), locator, bodyDigest);
  const review = { id: 'synthetic', author: 'Example', rating: 5, source: 'direct', verified: true, experience: 'mt-fuji-golf-day', country: '', body: 'Exact original.\n\nNext paragraph.', i18n };
  for (const [lang, text] of Object.entries(fake)) {
    assert.deepEqual(golfReviewTranslationFor(review, lang), { body: text, excerpt: text.split('\n\n')[0] });
    const slide = golfLandingSlides(lang, [review])[0];
    assert.equal(slide.excerpt, text.split('\n\n')[0]);
    assert.equal(slide.language, lang);
    assert.equal(slide.translated, true);
  }
  assert.equal(golfReviewTranslationFor(review, 'en'), null);
  assert.equal(golfLandingSlides('en', [review])[0].excerpt, 'Exact original.\n\nNext paragraph.');
  assert.equal(review.body, 'Exact original.\n\nNext paragraph.');
});
