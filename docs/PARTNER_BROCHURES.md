# Partner-branded experience PDFs

`/partner/brochures/` (Agency sales PDFs) is available to a site's members when referral or agency-booking features are enabled. Experience cards link to it; the experience slug filters the table when opened from a card. The default partner ordering leads with Shibuya ramen across the experience list, brochure table and booking selectors; explicit popularity/commission sorting still takes precedence.

- Company name, normalized PNG logo, theme color and contact details are per partner site. Only `partner_manager` can save them.
- Managers and `partner_agent` can save a tax-inclusive JPY sales-material price, per-person/per-group unit and price note for each live experience. Each row has explicit unset/fixed/inquiry modes. Unset and unsaved rows cannot be downloaded; choosing inquiry intentionally prints an enquiry prompt. Japanese and English notes are saved separately. Viewers may download saved material.
- Prices only affect these PDFs. They never update reservations, payments, underlying catalogue prices, commission rates or settlement snapshots.
- A saved brand and price are required before exporting edited content. At least one contact method is required. The PDF contact QR/link points to the agency's own HTTPS enquiry URL, never to KAMEHAME's checkout at a different price.
- The independent Japanese/English PDF language selector controls catalogue copy, pricing notes and labels. Catalogue photos (a hero and a second image where available) are combined with the chosen brand and price in a one-page A4 layout. User-entered brand/price notes are not translated automatically.
- The exact canvas preview is embedded at 200 dpi into a downloadable PDF. Text is rasterized, not selectable. Customer/ledger data and internal prices are never passed to the renderer. Printed brochures are static snapshots and must be re-exported after changes.
- The searchable table supports configured/unconfigured filters, saved row prices, draft modal previews, direct PDF downloads and a per-row agency booking action for authorized agents. Brand settings are collapsible. The table grows vertically with the page; only horizontal scrolling is internal, with a sticky experience column.
- The demo starts with three sample prices and supports local edits and sample PDF downloads. Writes remain blocked; the PDF is marked as a demo.

## Storage and authorization

Migration `0018_partner_brochures.sql` adds `partner_brochure_brands` and `partner_brochure_prices`. Both are scoped by `hotel_id`. Migration `0019_partner_brochure_options.sql` adds explicit price mode and English note in a separate child table to preserve compatibility with old seven-column price inserts during deployment. Legacy rows infer mode from price and keep their old note in both languages until edited. API routes are under `/api/portal/hotel/brochures`; they use the existing session, membership checks, feature flags, Origin and portal-header protection. Mutations are audited without logo bytes. Logos are uploaded as bounded PNG data URLs after client normalization; SVG/remote logo URLs are not accepted. Brand logos are private configuration, not publicly hosted files.

## KAMEHAME JAPAN official hotel brochures

`/partner/materials/` offers official brochures for hotel desks and guest rooms. This flow uses KAMEHAME branding and public catalogue prices; it never reads agency branding or marked-up sales prices. Guests scan the hotel's referral QR and book themselves on the public site. Agency materials remain in their separate menu.

- Choose an overview (ramen, calligraphy and kendo) or a live experience, then choose Japanese or English independently of the portal language. Preview and download use the same one-page A4 canvas. Prices are starting prices with tax/unit conditions and a latest-price/availability disclaimer; request bookings require availability confirmation.
- `/api/portal/hotel/official-brochures` exposes the catalogue to scoped members with referral access. `POST .../prepare` validates the session, hotel membership, referral feature and Origin, then returns only public content and the referral URL. It reuses an active brochure QR for the same hotel, target and language, or creates one through the existing audited link service. No migration is required.
- Overview QRs lead to the public language homepage; experience QRs lead to the corresponding language detail page. The QR and clickable PDF annotation both use `/r/:token` so existing referral attribution is retained. Brochure QR records appear in issued materials and do not replace the general QR/link pair.
- Demo preparation is read-only and uses a visibly labelled sample QR on `example.invalid`. It creates no real links, bookings or commissions.
- Downloads embed a 200 dpi raster page with a clickable booking area. Text is not selectable; printed content is a snapshot and should be downloaded again after catalogue changes. The referral QR remains reusable.

## Validation

Portal API tests cover manager/agent/viewer permissions, cross-site access, demo write denial, feature disabling, price limits, logo save/removal, unsafe URLs/content, CSRF and unchanged ledgers. A4 PDF samples were generated using the production renderer with the native canvas test runtime, rendered with Poppler, visually reviewed and checked for page size, image dimensions and clickable contact URL. iPhone Safari interaction was not independently verified.

Official brochure tests also cover public-price isolation from agency settings, stable and language-specific QRs, actual referral arrival attribution, invalid experience/language rejection and demo isolation. Japanese/English overview and ramen PDFs were rendered and reviewed, with A4 size and referral annotations verified.
