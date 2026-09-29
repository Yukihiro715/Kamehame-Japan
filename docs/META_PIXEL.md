# GTM plan for the Meta Pixel (pixel ID 4515856221984736)

## Before publishing the container
The site deploy with the changes under 'Site changes made after review', including the new privacy policy and banner text, must be live first. Check: `curl -s https://kamehame-japan.com/en/booked/ | grep -c kh-checkout-session` prints 1 or more.

Existing GTM objects on container GTM-57CCF3MQ:
- Data layer variables: DLV - value (value), DLV - currency (currency), DLV - enquiry_id (enquiry_id),
  DLV - transaction_id (transaction_id), DLV - email (user_data.email), DLV - consent_choice (consent_choice)
- Triggers: All Pages (page view), Initialization - All Pages, enquiry_sent (custom event), booking_paid (custom event),
  "同意した時" (custom event consent_choice where DLV - consent_choice equals granted)
- The site sets Google Consent Mode defaults in <head> before GTM: denied in EEA/UK/CH (by region), granted elsewhere,
  and re-applies a stored choice from localStorage with gtag('consent','update') before GTM loads.
- The banner, on a choice, runs gtag('consent','update',{ad_storage, ad_user_data, ad_personalization, analytics_storage}),
  then (new) fbq('consent', grant|revoke) if window.fbq exists, then pushes {event:'consent_choice', consent_choice}.
- The site is a React app with client-side navigation (history.pushState) between pages.
- enquiry_sent fires once on /{lang}/thanks/ after a full page load; booking_paid fires once per Stripe session
  on /{lang}/booked/ (the head script has already removed ?session_id=cs_… from the address) only after the server confirms Stripe says paid.

## Tag A — "Meta - Pixel (PageView)" — Custom HTML
Triggers: All Pages, 同意した時
Advanced settings: Tag firing options = Once per event
Consent settings: Require additional consent for tag to fire: ad_storage, ad_user_data, ad_personalization
```html
<script>
(function () {
  // Once per page load: Meta's own guard stops only the loader, not init/PageView.
  if (window.khMetaPixel) return;
  window.khMetaPixel = true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq.disablePushState = true;        // page changes come from Tag D (route_change)
  fbq.allowDuplicatePageViews = true; // else fbevents drops every PageView after the first
  fbq('set', 'autoConfig', false, '4515856221984736');
  fbq('init', '4515856221984736');
  fbq('track', 'PageView');
})();
</script>
```

## Tag B — "Meta - Lead" — Custom HTML
Trigger: enquiry_sent
Tag sequencing: fire "Meta - Pixel (PageView)" before this tag
Consent settings: same three
```html
<script>
(function () {
  if (typeof window.fbq !== 'function') return;
  var email = {{DLV - email}};
  var accepted = false;
  try { accepted = localStorage.getItem('kh-consent-2') === 'granted'; } catch (e) {}
  if (email && accepted) fbq('init', '4515856221984736', { em: String(email).trim().toLowerCase() });
  fbq('track', 'Lead',
    { value: {{DLV - value}}, currency: {{DLV - currency}} || 'JPY' },
    { eventID: {{DLV - enquiry_id}} });
})();
</script>
```

## Tag C — "Meta - Purchase" — Custom HTML
Trigger: booking_paid
Tag sequencing: fire "Meta - Pixel (PageView)" before this tag
Consent settings: same three
```html
<script>
(function () {
  if (typeof window.fbq !== 'function') return;
  var email = {{DLV - email}};
  var accepted = false;
  try { accepted = localStorage.getItem('kh-consent-2') === 'granted'; } catch (e) {}
  if (email && accepted) fbq('init', '4515856221984736', { em: String(email).trim().toLowerCase() });
  fbq('track', 'Purchase',
    { value: {{DLV - value}}, currency: {{DLV - currency}} || 'JPY' },
    { eventID: 'pay-' + String({{DLV - transaction_id}}).slice(-16) });
})();
</script>
```

## Tag D — "Meta - PageView (route)" — Custom HTML
Trigger: new Custom Event trigger "route_change" (event name route_change)
Advanced settings: Tag firing options = Once per event
Tag sequencing: fire "Meta - Pixel (PageView)" before this tag
Consent settings: same three
```html
<script>
(function () {
  if (!window.khMetaPixel || typeof window.fbq !== 'function') return;
  // A PageView still waiting in fbq.queue (fbevents.js not loaded yet, or Tag A
  // has just run as this tag's setup tag) goes out with the current URL anyway.
  var q = window.fbq.queue || [];
  for (var i = 0; i < q.length; i++) {
    if (q[i] && q[i][0] === 'track' && q[i][1] === 'PageView') return;
  }
  fbq('track', 'PageView');
})();
</script>
```

## Site changes made after review
- The head script moves ?session_id=cs_… out of /booked/ URLs into sessionStorage before GTM loads.
- user_data.email is pushed only when localStorage kh-consent-2 === 'granted' (explicit Accept; an Accept saved under the old key kh-consent, before the banner named Meta, no longer counts), for both enquiry_sent and booking_paid.
- route_change is pushed on every client-side page change (not the first load).
- /api/booking returns the email only when asked (&email=1, sent only after explicit Accept) and within 2 hours of the checkout starting.
- The consent head script re-applies the stored choice (gtag, Clarity, fbq) on bfcache restore and on changes from another tab.

## Events Manager settings
- Automatic advanced matching: turn OFF before publishing the container (it is ON as of 2026-09-29): Events Manager → dataset 4515856221984736 → Settings → Automatic advanced matching → off → Save. Wait 20 minutes, then `curl -s "https://connect.facebook.net/signals/config/4515856221984736?v=2.9.408&r=stable" | grep -c '"AutomaticMatching", true'` must print 0.
- "Automatically include more detailed page and product info": off
- Meta-enabled Conversions API: not set up
- First-party cookies: on (default)

## Check before publishing (GTM Preview + Events Manager → Test events)
1. Land on any page: one PageView. Click two internal links: one PageView each, with dl = the new URL.
2. Return from a Stripe test payment: once the page has loaded, the address bar shows /{lang}/booked/ with no ?session_id; no facebook.com/tr request has 'cs_' in dl, rl or eid; Purchase has eid pay-…. (GA4 requests may still carry the id only as transaction_id.)
3. No request carries ud[fn], ud[ln] or ud[ph]; ud[em] appears only after clicking Accept in the cookie banner.
