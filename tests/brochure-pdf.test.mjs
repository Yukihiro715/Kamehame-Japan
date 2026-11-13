import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {brochurePagesPdf}=await vite.ssrLoadModule('/lib/portal/brochure-pages-pdf.ts');
const {brochurePdf}=await vite.ssrLoadModule('/lib/portal/brochure-render.ts');
const jpeg=new Uint8Array([255,216,255,217]);
function inspect(pdf){
  const raw=Buffer.from(pdf).toString('latin1'),xref=Number(raw.match(/startxref\n(\d+)/)[1]);
  assert.equal(raw.slice(xref,xref+4),'xref');
  const entries=raw.slice(xref).match(/\d{10} 00000 n /g);
  entries.forEach((entry,i)=>assert.ok(raw.slice(Number(entry.slice(0,10))).startsWith(`${i+1} 0 obj\n`),'xref addresses its object'));
  return raw;
}
test('two-sided trifold exports landscape pages in order and keeps the referral annotation on the outside',()=>{
  const page={jpeg,width:2339,height:1654,widthPt:841.89,heightPt:595.28};
  const raw=inspect(brochurePagesPdf([{...page,link:{url:'https://example.com/r/hotel-123',rect:[361,76,472,187]}},page]));
  assert.match(raw,/\/Kids \[3 0 R 7 0 R\] \/Count 2/);
  assert.equal(raw.match(/\/MediaBox \[0 0 841.89 595.28\]/g).length,2);
  assert.equal(raw.match(/\/Subtype \/Link/g).length,1);
  assert.match(raw,/\/URI \(https:\/\/example.com\/r\/hotel-123\)/);
  assert.match(raw,/\/Rect \[361 76 472 187\]/);
  assert.ok(!raw.slice(raw.indexOf('7 0 obj'),raw.indexOf('8 0 obj')).includes('/Annots'));
});
test('PDF annotations safely escape literal delimiters and reject non-HTTPS actions',()=>{
  const page={jpeg,width:2339,height:1654,widthPt:841.89,heightPt:595.28};
  const escaped=inspect(brochurePagesPdf([{...page,link:{url:'https://example.com/r/(test)',rect:[1,2,3,4]}}]));
  assert.ok(escaped.includes('https://example.com/r/\\(test\\)'));
  const unsafe=inspect(brochurePagesPdf([{...page,link:{url:'javascript:alert(1)',rect:[1,2,3,4]}}]));
  assert.ok(!unsafe.includes('/Annots'));assert.ok(!unsafe.includes('javascript'));
});
test('single experience and agency PDFs retain portrait size and one page',()=>{
  const raw=inspect(brochurePdf(jpeg,'https://example.com/booking'));
  assert.match(raw,/\/Count 1/);assert.match(raw,/\/MediaBox \[0 0 595.28 841.89\]/);
});

test('agency PDF links keep independent contact targets and escape unsafe actions',async()=>{
  const {brochurePdfWithLinks}=await vite.ssrLoadModule('/lib/portal/brochure-render.ts');
  const raw=inspect(brochurePdfWithLinks(jpeg,[
    {url:'mailto:guide@example.com',rect:[1,2,3,4]},
    {url:'tel:+819012345678',rect:[5,6,7,8]},
    {url:'https://wa.me/819012345678',rect:[9,10,11,12]},
    {url:'javascript:alert(1)',rect:[0,0,1,1]},
  ]));
  assert.equal(raw.match(/\/Subtype \/Link/g).length,3);
  assert.match(raw,/mailto:guide@example.com/);assert.match(raw,/tel:\+819012345678/);assert.match(raw,/https:\/\/wa.me\/819012345678/);
  assert.ok(!raw.includes('javascript'));
  assert.ok(!inspect(brochurePdfWithLinks(jpeg,[])).includes('/Annots'));
});

test('QR and PDF destinations retain percent-encoded paths without double encoding',async()=>{
  const {brochurePdfWithLinks}=await vite.ssrLoadModule('/lib/portal/brochure-render.ts');
  const raw=inspect(brochurePdfWithLinks(jpeg,[{url:'https://example.com/%E4%BA%88%E7%B4%84?source=guide',rect:[1,2,3,4]}]));
  assert.ok(raw.includes('/%E4%BA%88%E7%B4%84?source=guide'));
  assert.ok(!raw.includes('%25E4'));
});
