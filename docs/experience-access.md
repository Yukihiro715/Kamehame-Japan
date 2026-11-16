# Experience access information

Reviewed 2026-11-16. Applies to the 35 live/preview non-golf English experiences and their existing localized pages (163 pages across five languages). Publication status and locale availability are unchanged.

## Data and evidence

`lib/experience-access-data.json` maps experience slugs to access profiles. `source` on each hotel/estimated route records the official hotel, operator or tourism authority page checked. The existing catalog's partner-approved `venue.known` supplies the station-to-venue information for private locations.

- Camellia FLOWER: operator's `https://tea-kyoto.com/find-us/flower` states 15 minutes on foot from Gion-Shijo and 10 minutes from Kiyomizu-michi bus stop. The exact destination was already approved for public maps in the catalog.
- Camellia GARDEN: `https://tea-kyoto.com/location/garden` states 5 minutes from Ryoanji station and 1 minute from Ryoanji-mae bus stop.
- Keio Plaza to Shinjuku station: 5 minutes, official hotel access page.
- Cerulean Tower to Shibuya station: 5 minutes, official hotel access page.
- THE GATE HOTEL KAMINARIMON to Tokyo Metro Asakusa station: 2 minutes, official hotel access page.
- Mandarin Oriental and Mitsui Garden Nihonbashi PREMIER have direct underground access to Mitsukoshimae. Swissôtel Nankai has direct access to Nankai Namba.

These are the only new numeric journey estimates. Other links open a mode-specific Google Maps route where the traveller can check distance and current time. Hotel names are departure examples, not claims of affiliation, pickup, or guaranteed proximity. Routes to an area/station explicitly do not represent a full journey to a private venue.

## Maintaining accuracy

Do not use the catalog's approximate map coordinates as a venue location. Use `scope: venue` only for an explicitly approved address. FLOWER Annex has its own entrance and must not inherit FLOWER's exact destination or station timings. Variable venues have no destination, route link or fabricated estimate until the operator confirms the venue.

To publish more numeric hotel-to-venue distances/times, verify an actual route to the confirmed venue, record its source/date, and distinguish walking, driving, and public transport. Do not infer minutes from straight-line distance. New numeric durations require evidence; missing times remain route links.

## Verification

- `npm run build`: passes.
- `node --test tests/experience-access.test.mjs`: 4 passing tests; checks SSR text across all existing locales, coverage, variable-venue privacy, annex distinction, numeric-source requirements and golf exclusion.
- `npx tsc --noEmit`: existing errors outside this change (`master` in two clinic catalog entries; Worker `Fetcher` type). No new errors in access files.
- Full browser visual verification could not run in this workspace: Chromium fails to create its process-singleton socket. Responsive tables use fixed layout and wrapping, but visual review remains required.
