import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { approvedGolfReview, serveSiteGolfReviewPhoto, stripWebpMetadata } = await vite.ssrLoadModule('/lib/site-reviewed-golf.ts');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const folder = 'reviews/2099-01/11111111-2222-3333-4444-555555555555/';
const key = folder + 'meta.json';
const pics = ['0-test.jpg', '1-test.jpg', '2-test.jpg'].map((f) => folder + f);
const ordered = [pics[2], pics[0], pics[1]];
const example = {
  consent: true, mediaConsent: true, experience: 'test-experience', rating: 5, lang: 'en', name: 'Guest PrivateSurname',
  email: 'private@example.test', ref: 'private-ref', body: 'Original review.\r\n\r\nNext paragraph.',
  at: '2099-01-05T10:00:01Z',
  media: pics.map((p) => ({ key: p, type: 'image/jpeg' })),
};
const approval = {
  month: '2099-01', record: sha(key), body: sha(example.body.replaceAll('\r\n', '\n')),
  photos: ordered.map(sha), windowStart: Date.parse('2099-01-05T10:00:00Z'), windowEnd: Date.parse('2099-01-05T10:01:00Z'),
  experience: example.experience, rating: 5, date: '2099-01-04',
};
const fake = (changes = {}, uploaded = '2099-01-05T09:59:59Z') => {
  const hits = [];
  return {
    hits,
    async list({ prefix }) { assert.equal(prefix, 'reviews/2099-01/'); return { objects: [{ key }, { key: folder + '2-test.jpg' }], truncated: false }; },
    async get(path) {
      hits.push(path);
      if (path === key) return { size: 512, async text() { return JSON.stringify({ ...example, ...changes }); } };
      if (!pics.includes(path)) return null;
      return { size: 5, uploaded: new Date(uploaded), httpMetadata: { contentType: 'image/jpeg' }, body: new Blob(['test']).stream() };
    },
    async put() { throw new Error('no writes'); },
  };
};

const chunk = (name, data) => {
  const b = Buffer.alloc(8 + data.length + (data.length & 1));
  b.write(name); b.writeUInt32LE(data.length, 4); Buffer.from(data).copy(b, 8);
  return b;
};
const riff = (...chunks) => {
  const b = Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP', 'ascii'), ...chunks]);
  b.writeUInt32LE(b.length - 8, 4);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const sampleImage = riff(chunk('VP8X', [0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0]), chunk('EXIF', [1,2,3]), chunk('ICCP', [1,2]), chunk('XMP ', [5,6]), chunk('VP8 ', [10]));
const images = {
  input() { return { transform() { return { async output() { return { response: () => new Response(sampleImage, { headers: { 'content-type': 'image/webp' } }) }; } }; } }; },
};

test('only approved text is displayed; projected first name and ordered image aliases contain no operational details', async () => {
  const value = await approvedGolfReview(fake(), approval);
  assert.equal(value.review.author, 'Guest');
  assert.equal(value.review.body, 'Original review.\n\nNext paragraph.');
  assert.equal(value.review.verified, true);
  assert.deepEqual(value.orderedPhotoKeys, ordered);
  assert.equal(value.review.photos.length, 3);
  const encoded = JSON.stringify(value.review);
  assert.doesNotMatch(encoded, /PrivateSurname|private@example|private-ref|meta\.json|2099-01\//);
  assert.equal(await approvedGolfReview(fake({ consent: false }), approval), null);
  assert.equal(await approvedGolfReview(fake({ body: 'Changed text' }), approval), null);
  assert.deepEqual((await approvedGolfReview(fake({ mediaConsent: false }), approval)).review.photos, []);
});

test('approved image is first; the response retains pixels and strips metadata', async () => {
  const bucket = fake();
  const [first] = (await approvedGolfReview(bucket, approval)).review.photos;
  const response = await serveSiteGolfReviewPhoto(new Request('https://test.example' + first), bucket, images, approval);
  assert.equal(response.status, 200);
  assert.equal(bucket.hits.at(-1), ordered[0]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(result, Buffer.from(stripWebpMetadata(sampleImage)));
  assert.doesNotMatch(result.toString('ascii'), /EXIF|ICCP|XMP /);
  assert.match(result.toString('ascii'), /VP8 /);
  assert.equal(result[20] & 0x2c, 0);
});

test('rejects replacement after submission, missing permission, and raw key requests', async () => {
  const [first] = (await approvedGolfReview(fake(), approval)).review.photos;
  const request = (s) => new Request('https://test.example' + s);
  assert.equal((await serveSiteGolfReviewPhoto(request(first), fake({}, '2099-01-05T10:00:02Z'), images, approval)).status, 404);
  assert.equal((await serveSiteGolfReviewPhoto(request(first), fake({ mediaConsent: false }), images, approval)).status, 404);
  assert.equal((await serveSiteGolfReviewPhoto(request('/' + key), fake(), images, approval)).status, 404);
  assert.equal((await serveSiteGolfReviewPhoto(request(first + '?key=' + key), fake(), images, approval)).status, 404);
});
