# Partner-branded experience PDFs

`/partner/brochures/` is available to a site's members when referral or agency-booking features are enabled. Experience cards and the materials page link to it; the experience slug is preselected from the card.

- Company name, normalized PNG logo, theme color and contact details are per partner site. Only `partner_manager` can save them.
- Managers and `partner_agent` can save a tax-inclusive JPY sales-material price, per-person/per-group unit and price note for each live experience. Empty prices display an enquiry prompt. Viewers may download saved material.
- Prices only affect these PDFs. They never update reservations, payments, underlying catalogue prices, commission rates or settlement snapshots.
- A saved brand and price are required before exporting edited content. At least one contact method is required. The PDF contact QR/link points to the agency's own HTTPS enquiry URL, never to KAMEHAME's checkout at a different price.
- Japanese/English catalogue copy and photos are combined with the chosen brand and price in a one-page A4 layout. User-entered brand/price notes are not translated automatically.
- The exact canvas preview is embedded at 200 dpi into a downloadable PDF. Text is rasterized, not selectable. Customer/ledger data and internal prices are never passed to the renderer. Printed brochures are static snapshots and must be re-exported after changes.
- The demo supports local edits and sample PDF downloads. Writes remain blocked; the PDF is marked as a demo.

## Storage and authorization

Migration `0018_partner_brochures.sql` adds `partner_brochure_brands` and `partner_brochure_prices`. Both are scoped by `hotel_id`. API routes are under `/api/portal/hotel/brochures`; they use the existing session, membership checks, feature flags, Origin and portal-header protection. Mutations are audited without logo bytes. Logos are uploaded as bounded PNG data URLs after client normalization; SVG/remote logo URLs are not accepted. Brand logos are private configuration, not publicly hosted files.

## Validation

Portal API tests cover manager/agent/viewer permissions, cross-site access, demo write denial, feature disabling, price limits, logo save/removal, unsafe URLs/content, CSRF and unchanged ledgers. A4 PDF samples were generated using the production renderer with the native canvas test runtime, rendered with Poppler, visually reviewed and checked for page size, image dimensions and clickable contact URL. iPhone Safari interaction was not independently verified.
