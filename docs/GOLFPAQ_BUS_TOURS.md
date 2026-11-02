# Shared-bus golf (GOLFPAQ) integration — review checklist

This branch is deliberately **not a production launch**.

- Product: 18-hole self-play shared-bus tours, published from JST today + 7 days through the end of the third published calendar month.
- Source: partner-approved public HTML. No API; crawl in the Cloudflare scheduled handler at most once every three hours, four day-pages at a time, with a stored KV snapshot. If the feed is older than six hours, display no apparent bookable availability.
- Data: date, course, pickup notes, price, seats, IDs and photo from the partner page. Exclude full tours and lesson tours. Source and provenance are preserved; no promise of reserved seats.
- Published quote: GOLFPAQ amount + JPY 15,000 per person. Optional club rental: JPY 5,500 per renter.
- Flow: choose tour and party size -> send request -> customer confirmation by email and staff notification. The site does **not** take immediate payment or reserve seats. Telephone booking with the partner is operationally separate.
- Payment-link automation is **not enabled** on this branch: choose and approve the licensed travel seller/agency arrangements, cancellation and refund terms, and a verified Stripe key + webhook/ledger workflow before activating the next phase.
- Cancellation: no unverified promises. Collect affirmative acknowledgement and provide the governing terms before payment.
- Cross-sell: custom golf booking at its existing arrangement fee and travel-provider introduction remains live.

## Staging checks before merge / deploy
1. Test partner day parser with a known ordinary self-round and a sold-out/lesson card. Verify Japanese page structure, optional image and pickup information.
2. Run CI build and existing automated tests. Review TypeScript and app-router route conflicts.
3. Configure the staging READY_STATE KV; run the scheduled job and ensure a recent snapshot exists. The live page intentionally shows unavailable until the snapshot is populated.
4. Confirm mail delivery from staging and a correctly priced request at party sizes 1–4, with and without rental, plus invalid/stale requests being rejected.
5. Confirm visitors do not receive an active payment link and no user data reaches the partner booking website.
6. Review travel-business legal/agency relationship, operator identity, English cancellation copy and refund responsibility with the responsible licensed operator.
7. Confirm consent/privacy and add enquiry-to-payment tracking before connecting real automated payment links.

Reversion: don't merge this branch or revert its commits; the existing custom golf booking component and pricing are preserved.
