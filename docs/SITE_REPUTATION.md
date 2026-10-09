# Site reputation and security checklist

Why this exists: on 2026-10-08 a guest cancelled a golf booking because her
browser or security software "flagged the site for malware and phishing" and
she could not verify the company behind it. The audit found no compromise;
the verdicts came from heuristics that a brand-new domain triggers easily.

## What the audit found (2026-10-08)

| Finding | Cause | Status |
| --- | --- | --- |
| Sucuri SiteCheck: "Known malware" on every page | vinext 0.0.50 streams its RSC payload as `<script>` tags after `</body></html>`; the scanner reads a script outside the document as an injection (`html_anomaly`). | Fixed in `worker/index.ts`: the closing tags are moved to the end of the stream. `tests/rendered-html.test.mjs` guards it. Fresh scans are clean. |
| Trend Micro Site Safety: `http://kamehame-japan.com` rated "Dangerous / Phishing"; https "Untested / newly observed domain" | New-domain reputation, not content. | Needs a reclassification request (below). |
| No security headers | vinext ignores `next.config` headers() in production. | Fixed in `worker/index.ts`: HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, frame-ancestors CSP. |
| Company hard to verify from the site | No corporate number, no link to the operator, no Organization markup. | Fixed: Organization JSON-LD in `app/layout.tsx`, 法人番号 and operator website on `/legal/`, footer links to prosent.co.jp/company/. |
| DMARC `p=none`, no reports | Weak mail policy makes spoofing checks fail softly. | DNS change needed (below). |
| Domain is 5 weeks old, WHOIS privacy, no DNSSEC | Reputation services weigh these. | Time, plus the optional items below. |

Google Safe Browsing, Norton Safe Web and the served HTML (identical to the
build) were clean. Fortinet showed "Detected" on URLVoid (1 of 36 engines).

## Update 2026-10-09: five reputation feeds, not browser warnings

The guest's screenshot showed SSLTrust's "Website Security Check", which replays VirusTotal's ~93 URL scanners. On 2026-10-05 it showed 3 positives; on 2026-10-09 it shows 5: Forcepoint ThreatSeeker (phishing), Fortinet (phishing), Sophos (malware), Webroot/OpenText BrightCloud (malicious), alphaMountain.ai (phishing). All five are stored, automated new-domain classifications in five independent databases; none is a report of actual phishing, and the live site holds no credential or card forms, malware, obfuscation or cloaking. They do not clear on their own (VirusTotal re-crawled the fixed site on 2026-10-08 and the five remained), so each vendor needs its own reclassification request. Full per-vendor steps, form fields and paste-ready English texts: `docs/REPUTATION_RECLASSIFICATION.md`.

Do not run SSLTrust, VirusTotal, URLVoid or similar aggregate checkers again until all five requests are filed: every run resubmits the URL to ~93 engines and refreshes the stored verdicts.

Site-side changes made 2026-10-09: `/.well-known/security.txt` served by the Worker; `X-Robots-Tag: noindex` on the booked and thanks pages; the booked page no longer announces a payment unless a Stripe checkout session id is present; the placeholder partner form became a contact block; the empty hidden widget mount was removed from experience pages; the legal notice states that card payments happen on a Stripe-hosted page.

## Manual checklist (owner actions)

Done items get a date.

1. Trend Micro Site Safety reclassification: https://global.sitesafety.trendmicro.com/ — submit `http://kamehame-japan.com`, `http://www.kamehame-japan.com`, `https://kamehame-japan.com`, `https://www.kamehame-japan.com` as Safe, category Travel, "I own this website". Replies take 1–3 business days.
2. Cloudflare: SSL/TLS → Edge Certificates → enable HSTS (max-age 12 months, include subdomains); SSL mode Full (strict). Optionally submit at https://hstspreload.org/ (only after HSTS has run cleanly for a few weeks).
3. DMARC: create the `dmarc@kamehame-japan.com` mailbox in Google Workspace, then change the `_dmarc` TXT record to `v=DMARC1; p=quarantine; rua=mailto:dmarc@kamehame-japan.com; pct=100`. SPF and DKIM already pass for Google and Resend.
4. DNSSEC: Cloudflare DNS → DNSSEC → enable, then add the DS record at Onamae.com.
5. Other reputation services: FortiGuard https://www.fortiguard.com/webfilter (request Travel), McAfee/Trellix TrustedSource https://trustedsource.org/ , Norton Safe Web owner verification https://safeweb.norton.com/ , urlscan.io public scan. Search Console → Security issues tab should stay empty.
6. Presence outside the site: Google Business Profile for KAMEHAME JAPAN (Prosent Inc. address), mention KAMEHAME JAPAN on https://prosent.co.jp/ (services or news page), list the experiences on a marketplace that collects reviews, keep Instagram/LinkedIn profiles that link back. Add any real profile to `sameAs` in `app/layout.tsx`.
7. Legal notice: replace the "disclosed on request" telephone row with a real number once one is set up (`lib/legal.ts`, both languages).
8. Optional: turn WHOIS privacy off at Onamae.com so the registrant shows the company.
9. Search Console: resubmit `sitemap.xml` (it now includes the golf pages) and request indexing for the home, golf, geiko and legal pages.
10. Re-check Sucuri with a forced scan: `https://sitecheck.sucuri.net/api/v3/?scan=kamehame-japan.com&clear=1` (cached results last several hours).

## Replying to a guest who saw a warning

Keep it short and factual: name the cause (a new-domain reputation flag or a scanner heuristic, not malware), say what was checked and fixed, point to the legal notice and corporate number, apologise, and ask which product showed the warning (a screenshot helps the reclassification request). Do not argue with the guest's decision.
