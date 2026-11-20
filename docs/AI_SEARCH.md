# Search and AI-readable content

Experience pages use `lib/experience-seo.ts` for both their visible basic facts and JSON-LD. The commercial entity links to the global organization and website IDs. Product offers must use the catalog price tables, state JPY and their party-size unit, and must never assert that an unconfirmed date is available. Consultation-only, paused and pending-price listings do not publish offers; preview pages omit the experience graph and remain noindex. Only first-party published ratings are declared.

The detail FAQ graph receives the exact FAQ displayed by the page, including provisional-booking copy. Keep these together when editing booking conditions. General language, transport, inclusion and cancellation guidance lives in `lib/booking-guidance.ts`; these conditions vary by product.

The kendo and Kyoto tea comparison articles render their tables from current catalog entries. An option without a translation links to its existing English route and is labelled English. Do not create nonexistent localized links or copy prices into article prose. Private venue names and addresses remain private; access estimates remain in the separately sourced access profiles.

`serializeJsonLd` escapes HTML delimiters in structured data. Use it for new JSON-LD scripts. Validate the actual built HTML with `tests/experience-seo.test.mjs` as well as catalog-level assertions. The sitemap tracks changes to the shared facts and comparison data, excludes previews, and advertises only existing locale routes.

Structured data and accessible text support discovery; they do not guarantee indexing, rich results or AI citations.
