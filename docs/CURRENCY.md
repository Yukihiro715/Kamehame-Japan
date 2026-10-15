# Display currency (USD / JPY)

Every price on kamehame-japan.com is set, quoted, charged and measured in Japanese yen. The
header's currency switcher only changes how prices are *displayed*: in USD mode each yen figure
is shown as a dollar estimate ("≈ US$550") with the yen beside or under it ("¥82,500 · billed in
JPY") and an estimate notice. Nothing else changes:

| Stays in yen | Where |
|---|---|
| Price masters | `lib/golf-prices.ts`, `lib/catalog*.ts` |
| Server-side estimate and validation | `app/api/contact/route.ts` |
| Amount sent with a request | `estimate` in the enquiry payload, `value`/`currency: "JPY"` in the GTM event |
| Stripe payment links and webhooks | `app/api/webhooks/stripe`, `app/api/booking` |
| GA4 `value` / `currency` | `components/site/booked-view.tsx` purchase event, golf request event |
| Structured data `priceCurrency` | `lib/seo.ts` |
| Emails, Slack, ledger, admin | unchanged |

## Pieces

- `lib/currency.ts` — types, `usdOf()`, `usd()`, `fxText()` (rewrites yen figures inside an
  already-formatted string), localStorage keys.
- `components/site/currency-context.tsx` — `CurrencyProvider` (mounted in `app/layout.tsx`) and
  `useCurrency()`. The server always renders yen; the stored choice (`kh-currency`) and the rate
  are read after mount, so there is no hydration mismatch. The choice survives reloads, navigation
  and language changes (the language lives in the URL, the currency in localStorage; they are
  independent).
- `components/site/currency-switcher.tsx` — the header dropdown ("USD $" / "JPY ¥"), styled like the
  language switcher.
- `components/site/money.tsx` — `<Fx>` (a formatted price string that follows the currency),
  `<Yen n>` (headline figure), `<JpyRef n>` / `<JpyRefText>` (the yen line under a dollar headline),
  `<FxNote>` (the estimate notice with the rate and its date). Strings without a yen figure
  ("Custom quote") pass through untouched.
- `app/api/fx/route.ts` — the rate. Source: Frankfurter (ECB reference rates, published once per
  working day, free, no key). Cached in the Workers edge cache for 24 hours; the last good answer
  is kept for 30 days and served marked `stale` if the source is down. With no rate at all the
  endpoint answers 503 and the site stays in yen even if USD is selected. The browser also caches
  the rate in localStorage (`kh-fx`) for 12 hours.

## Validation and staleness

A rate is used only if it passes `validateRate()` in `lib/currency.ts`: base USD, quote JPY, a figure between 50
and 400 yen per dollar, an ISO date that is not more than 36 hours in the future and not more than
`MAX_RATE_AGE_DAYS` (7) days old. The browser cache (`kh-fx`) also needs a `cachedAt` within the last 12 hours
and not in the future; broken JSON or a wrong-currency cache is ignored. An open page re-checks every 10 minutes
and when its tab becomes visible again, drops a rate whose copy has aged past 12 hours or whose published date
has passed the 7-day limit, and fetches again (after a failure, not more often than every 5 minutes). The
server marks a last-known rate `stale: true` when the source is down; the page says so under the rate line. With
USD chosen and no usable rate, prices stay in yen and a notice says the rate is loading or unavailable.

## Rounding

USD figures are whole dollars, rounded from the yen figure they sit beside. Per-person dollar
figures come from the yen per-person figure (the yen group total divided by the party), so
"US$ per person × party" can differ from the group estimate by a dollar or two; both are marked
as estimates.

## Testing with a fixed rate

In the browser console:

```js
localStorage.setItem("kh-fx", JSON.stringify({ base: "USD", quote: "JPY", rate: 150, date: "2026-10-14", fetchedAt: new Date().toISOString(), cachedAt: new Date().toISOString() }));
localStorage.setItem("kh-currency", "USD");
location.reload();
```

Remove both keys (or pick JPY in the header) to return to the live rate.

## Adding a currency later

Add it to `Currency` / `CURRENCIES` in `lib/currency.ts`, extend the rate endpoint and
`FxRate` to carry more than one quote, and give `fxText()` / `usd()` a per-currency formatter.
The components only ask the context whether a non-yen display is active and which rate to use.
