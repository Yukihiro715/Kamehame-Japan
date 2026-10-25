import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
const vite=await createServer({configFile:false,server:{middlewareMode:true}});
after(()=>vite.close());
const {captureTouch,sanitizeAttribution,channel,ATTRIBUTION_TTL,ATTRIBUTION_KEY}=await vite.ssrLoadModule('/lib/attribution.ts');
test('only allowlisted campaign data survives; unrelated queries and referrer paths do not',()=>{
 const t=captureTouch('https://example.com/golf?utm_source=meta&utm_medium=paid_social&email=private&fbclid=abc','https://facebook.com/private?q=secret');
 assert.equal(t.landing,'https://example.com/golf');assert.equal(t.referrer,'https://facebook.com');assert.equal(t.email,undefined);assert.equal(channel(t),'meta / paid_social');
 assert.equal(channel(captureTouch('https://example.com/?fbclid=abc','')),'meta / unspecified');
 assert.equal(channel(captureTouch('https://example.com/?gclid=abc','')),'google / paid');
});
test('invalid and stale data is rejected',()=>{
 const t=captureTouch('https://example.com/','',Date.now()-ATTRIBUTION_TTL-1000);
 assert.equal(sanitizeAttribution({version:1,first:t,last:t}),undefined);
 assert.equal(sanitizeAttribution({version:1,first:{...t,at:Date.now(),landing:'javascript:bad'},last:t}),undefined);
});
test('consent, internal navigation, return campaign and revocation',async()=>{
 const db=new Map();globalThis.localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)};
 globalThis.window={};globalThis.document={referrer:'https://google.com/search?q=private'};
 globalThis.location={href:'https://example.com/?utm_source=google&utm_medium=cpc&gclid=one'};
 const {readAttribution}=await vite.ssrLoadModule('/lib/attribution-client.ts');
 assert.equal(readAttribution(),undefined);assert.equal(db.has(ATTRIBUTION_KEY),false);
 db.set('kh-consent-2','granted');const a=readAttribution();assert.equal(a.first.gclid,'one');
 location.href='https://example.com/golf';const b=readAttribution();assert.deepEqual(b,a);
 location.href='https://example.com/golf?utm_source=meta&utm_medium=paid_social&fbclid=two';const c=readAttribution();assert.equal(c.first.gclid,'one');assert.equal(c.last.fbclid,'two');
 db.set('kh-consent-2','denied');assert.equal(readAttribution(),undefined);assert.equal(db.has(ATTRIBUTION_KEY),false);
 delete globalThis.window;delete globalThis.document;delete globalThis.location;delete globalThis.localStorage;
});
