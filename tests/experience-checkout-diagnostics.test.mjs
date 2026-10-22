import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
const {diagnoseExperienceCheckout}=await vite.ssrLoadModule('/lib/experience-checkout-diagnostics.ts');
const env={EXPERIENCE_CHECKOUT_ENABLED:'true',STRIPE_CHECKOUT_KEY:'rk_live_test-only',STRIPE_READ_KEY:'rk_live_read-only',STRIPE_EXPERIENCE_WEBHOOK_SECRET:'whsec_test-only',GOLF_AUTOMATION_URL:'https://script.google.com/macros/s/example/exec',GOLF_AUTOMATION_TOKEN:'test-automation-token'};
const request=(token)=>new Request('https://example.com/api/experience-checkout/health',{headers:token?{authorization:'Bearer '+token}:{}});

test('unauthorized diagnostics reveal nothing and never contact the ledger',async()=>{
  const old=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;throw Error('must not fetch');};
  try {
    for(const token of [undefined,'wrong-token','x'.repeat(5000)]) {
      const response=await diagnoseExperienceCheckout(request(token),env);
      assert.equal(response.status,403);assert.deepEqual(await response.json(),{ok:false});
    }
    assert.equal((await diagnoseExperienceCheckout(request(env.GOLF_AUTOMATION_TOKEN),{...env,GOLF_AUTOMATION_TOKEN:undefined})).status,403);
    assert.equal(calls,0);
  } finally {globalThis.fetch=old;}
});

test('authenticated diagnostics identify configuration failure without exposing values',async()=>{
  const old=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    assert.equal(JSON.parse(options.body).action,'experience_health');
    return Response.json({ok:true,ready:true,version:'2026-10-22',unexpected_secret:'do-not-return'});
  };
  try {
    for(const [changed,expected] of [[{EXPERIENCE_CHECKOUT_ENABLED:'true '},'enabled'],[{STRIPE_CHECKOUT_KEY:'sk_live_not-restricted'},'checkout_key'],[{STRIPE_READ_KEY:undefined},'read_key']]) {
      const response=await diagnoseExperienceCheckout(request(env.GOLF_AUTOMATION_TOKEN),{...env,...changed});
      assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
      const body=await response.text(),data=JSON.parse(body);
      assert.equal(data.ready,false);assert.equal(data.checks[expected],false);assert.equal(data.ledger.ready,true);
      for(const secret of [env.GOLF_AUTOMATION_TOKEN,env.STRIPE_CHECKOUT_KEY,env.STRIPE_READ_KEY,env.STRIPE_EXPERIENCE_WEBHOOK_SECRET,'do-not-return']) assert.equal(body.includes(secret),false);
    }
  } finally {globalThis.fetch=old;}
});

test('readiness distinguishes healthy, old and unavailable ledgers without exposing errors',async()=>{
  const old=globalThis.fetch;
  try {
    for(const [health,ready,current] of [[{ok:true,ready:true,version:'2026-10-22'},true,true],[{ok:true,ready:true,version:'old'},false,false],[{ok:true,ready:false,version:'2026-10-22'},false,true]]) {
      globalThis.fetch=async()=>Response.json(health);
      const response=await diagnoseExperienceCheckout(request(env.GOLF_AUTOMATION_TOKEN),env),data=await response.json();
      assert.equal(data.ready,ready);assert.equal(data.ledger.current_version,current);
    }
    globalThis.fetch=async()=>{throw Error('sensitive upstream response');};
    const response=await diagnoseExperienceCheckout(request(env.GOLF_AUTOMATION_TOKEN),env);
    assert.deepEqual((await response.json()).ledger,{reachable:false,current_version:false,ready:false});
  } finally {globalThis.fetch=old;}
});
