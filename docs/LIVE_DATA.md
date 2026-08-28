# High Colorado — Living Data Strategy

High Colorado treats freshness as product data. Every live value should carry:

- source
- fetched_at
- effective_at / issued_at when provided
- expires_at when known
- status: live | due | stale | unavailable | manual_verification
- confidence / provenance notes

## Recommended cadences

| Source class | App-open cadence | Background/backend cadence | Triggered refresh |
|---|---:|---:|---|
| NWS active alerts | 5 min | 5 min for upcoming climb areas | app resume, reconnect, selected peak changes |
| NWS forecast/hourly | 15 min on climb day; 60 min otherwise | 15–60 min depending on trip proximity | start time/date/peak changes |
| Community route conditions | 1–2 hr near trip | 1–2 hr | app resume, route changes |
| Trailhead / closure / fire restrictions | 1 hr near departure | 1 hr | app resume, vehicle/trailhead changes |
| Camping / permit / reservation facts | 6 hr until confirmed | 6 hr | date/camping mode changes |
| CAIC avalanche forecast | after forecast issuance + pre-departure | seasonal | snow-relevant route/date changes |

## Frontend vs backend

The GitHub Pages client can call public CORS-friendly endpoints such as NWS directly. Sources requiring API keys, source normalization, change detection, scraping review, or push fan-out belong behind a backend.

Recommended production backend:

1. Supabase Postgres stores normalized source snapshots and user trip subscriptions.
2. Scheduled Edge Functions refresh source adapters by cadence.
3. A diff engine determines whether a change is meaningful.
4. Only meaningful changes become trip events.
5. Web Push sends opt-in notifications to subscribed devices.
6. The PWA stores the newest trip packet in IndexedDB for offline use.

## Notification philosophy

Notify about factual changes, not declarations of safety.

Good examples:
- NWS warning/advisory added or severity changed.
- Trailhead road closed or reopened.
- Permit/reservation requirement changed.
- Land-manager closure/fire restriction changed.
- New recent route condition materially changes snow/route access context.
- Offline trip packet is stale before departure.

Avoid:
- "This mountain is safe."
- Notification for every forecast temperature fluctuation.
- Repeating unchanged community reports.

## Meaningful-change thresholds

Suggested initial thresholds for weather-change notifications:
- precipitation probability crosses 30%, 50%, or 70%
- thunderstorm wording appears/disappears
- sustained or forecast wind changes by >= 10 mph or crosses 25/35/45 mph bands
- summit temperature moves by >= 10°F near the planned outing window
- a new NWS watch/warning/advisory becomes active at the peak point

These thresholds should remain transparent and user-adjustable; they are notification filters, not safety verdicts.
