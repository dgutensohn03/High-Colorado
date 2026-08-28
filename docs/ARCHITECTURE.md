# High Colorado PWA Architecture

## Product surfaces

1. Explore — 58 peaks, standard routes, route comparisons, learning content.
2. Plan — multi-peak itinerary, pace model, start times, camping, route-day timeline, summit explorer.
3. Field Briefing — intentionally compact offline-first packet for one climb/day.
4. Account — synced preferences, saved plans, completed climbs, personal pace calibration, notification preferences.

## Recommended production architecture

### Frontend
- React + TypeScript + Vite
- MapLibre for maps
- Workbox or a carefully scoped service worker
- IndexedDB for structured offline climb packets
- Cache Storage for immutable static assets

### Hosted static shell
- GitHub Pages for the public portfolio/demo frontend
- GitHub Actions for build/test/deploy

### Backend
Use Supabase (recommended for this portfolio) or equivalent managed backend:
- Auth: email magic link / OAuth
- Postgres: profiles, trips, objectives, climb logs, notification preferences
- Row Level Security: users only access their own private trip/account records
- Storage: optional trip photos
- Edge/server function: Web Push subscription management + scheduled notifications

Do not store privileged API/service keys in GitHub Pages. Public browser keys must be limited by backend security rules/RLS.

## Offline model

### App shell
Cached automatically so the installed app opens without network connectivity.

### Saved climb packet
Explicit user action: “Save for offline climb.” Persist a versioned packet containing:
- selected peak + route fact snapshot
- verified route geometry / waypoints only
- itinerary + start/pace settings
- calculated timeline
- emergency card
- trailhead directions text and coordinates
- last downloaded weather snapshot with fetched-at timestamp
- last downloaded access/condition snapshot with fetched-at timestamp
- gear checklist

Every stale/live field displays its `fetchedAt` value. Offline snapshots must never be visually presented as live.

## Notifications

Useful notification classes:
- evening-before plan reminder
- morning-of start reminder
- “weather forecast changed materially” alert
- trailhead/access change alert
- reservation/permit reminder
- offline packet is stale / refresh before departure

Never send pseudo-live mountain safety conclusions such as “safe to summit.” Alerts report changed facts/forecasts and explain what changed.

## Personalization

Personal pace should be learned from the user's completed trip logs, with conservative confidence rules:
- compare actual vs expected ascent/descent segments
- maintain route-class-specific calibration rather than one universal speed
- require multiple samples before calling a model “personalized”
- allow reset/disable
- continue showing a likely range, not a single guaranteed ETA

## Interview discussion

The strongest engineering tradeoffs to explain:
1. Why GitHub Pages hosts the static PWA while auth/push require a backend.
2. Why offline weather is timestamped and not treated as live.
3. Why verified trail geometry is distinct from trip sequence or inferred waypoints.
4. Why the time model is explainable and confidence-banded.
5. Why push notifications require explicit user opt-in and are event-oriented, not spammy.
6. How RLS / ownership rules protect private plans in a public frontend application.
