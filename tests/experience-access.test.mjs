import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true }, logLevel: 'silent' });
after(() => vite.close());
const { catalogFor, previewsFor } = await vite.ssrLoadModule('/lib/catalog.ts');
const { accessFor, accessCopy, accessData } = await vite.ssrLoadModule('/lib/experience-access.ts');
const { ExperienceAccess } = await vite.ssrLoadModule('/components/site/experience-access.tsx');

test('every live and preview non-golf experience has server-rendered access in all languages', () => {
  for (const lang of Object.keys(accessCopy)) {
    const entries = [...catalogFor(lang).experiences, ...previewsFor(lang).experiences].filter(e => ['live','preview'].includes(e.status) && e.category !== 'golf');
    assert.ok(entries.length > 0);
    console.log(`${lang}: ${entries.length} experience pages checked`);
    for (const exp of entries) {
      assert.ok(accessFor(exp.slug), exp.slug);
      const html = renderToStaticMarkup(React.createElement(ExperienceAccess, {exp,lang}));
      assert.ok(html.includes('id="access"'), `${lang}/${exp.slug}`);
      assert.ok(html.includes('<table>'));
      assert.ok(html.includes(accessCopy[lang].hotels));
    }
  }
});

test('variable venues never publish invented destinations or route estimates', () => {
  const exp = catalogFor('en').experiences.find(e => e.slug === 'osaka-kendo-experience-tour');
  const html = renderToStaticMarkup(React.createElement(ExperienceAccess, {exp,lang:'en'}));
  assert.ok(html.includes('selected for your date'));
  assert.ok(!html.includes('maps/dir'));
  for (const p of Object.values(accessData.profiles).filter(p => p.scope === 'variable')) {
    assert.equal(p.destination, null);
    assert.ok([...p.hotels,...p.stations].every(r => !r.minutes));
  }
});

test('private venue links end at a labelled public landmark; annex is not the Flower entrance', () => {
  const exp = catalogFor('en').experiences.find(e => e.slug === 'nihonbashi-kendo-experience');
  const html = renderToStaticMarkup(React.createElement(ExperienceAccess, {exp,lang:'en'}));
  assert.ok(html.includes('not the meeting point'));
  assert.ok(html.includes('destination=Mitsukoshimae'));
  assert.equal(accessFor('kyoto-higashiyama-annex-tea-ceremony').scope, 'area');
  assert.ok(!accessFor('kyoto-higashiyama-annex-tea-ceremony').destination.en.includes('FLOWER'));
});

test('only sourced numeric estimates are published; golf and unconfigured listings stay unchanged', () => {
  for (const p of Object.values(accessData.profiles)) for (const r of [...p.stations,...p.hotels]) {
    if (r.minutes || r.direct) assert.match(r.source, /^https:\/\//);
  }
  assert.equal(accessFor('mt-fuji-golf'), undefined);
  assert.equal(renderToStaticMarkup(React.createElement(ExperienceAccess, {exp:{slug:'evening-with-geiko',category:'golf'},lang:'en'})), '');
});
