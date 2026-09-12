# High Colorado

🌐 **Live Demo:** [High Colorado on GitHub Pages](https://dgutensohn03.github.io/High-Colorado/)

**v1.9 polished unified UI** — consistent alpine design system, unified desktop/mobile navigation, Explore → Plan → Conditions → Learn flow, open-license imagery, PWA/offline shell, and living NWS summit data.

— Installable 14er Planner PWA

This folder is a GitHub Pages-ready PWA wrapper around the current interactive High Colorado dashboard prototype.

## Included now
- installable Web App Manifest
- service-worker app-shell caching
- offline fallback
- notification permission + local test notification
- Web Push service-worker handler ready for a backend subscription service
- GitHub Pages Actions deployment workflow
- PWA icons
- architecture and interview-story documentation
- existing interactive planner demo and explainable planning engine


## v1.6 map-first trip builder
The primary selection flow now lives on the map instead of behind the objective picker:
- all loaded peaks remain visible and tappable
- search by peak or range directly on the map
- filter by route class and range
- tap a marker for a compact route/access/risk preview
- add/remove the peak without leaving the map
- selected objectives become numbered itinerary markers
- a persistent trip tray keeps the selected sequence visible
- explicit Explore and Fit Trip controls prevent surprise auto-zooming
- dashed peak-to-peak geometry is labeled as trip sequence, never as a hiking/driving route
- active objective shows its trailhead parking marker

The current PWA prototype contains the curated peak records shipped with the demo. The same interaction is designed to operate against the production 58-peak catalog.

## Preview locally
Service workers require HTTP(S), not `file://`.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Publish with GitHub Pages
1. Create a GitHub repository and copy this folder to the repository root.
2. Push to `main`.
3. In GitHub → Settings → Pages, set **Source** to **GitHub Actions**.
4. The included `.github/workflows/pages.yml` deploys the repository.

## Accounts / real push notifications
GitHub Pages is the static frontend. Production accounts, cross-device sync, private user plans, and remote push delivery require a backend. The recommended portfolio architecture is Supabase Auth + Postgres/RLS + an Edge Function for Web Push subscriptions and scheduled/event-driven notifications.

See `docs/ARCHITECTURE.md` and `docs/INTERVIEW.md`.

## v1.7 living-data freshness engine
High Colorado now treats source freshness as part of the product UX instead of hiding refreshes behind a generic spinner.

Implemented in the GitHub Pages prototype:
- exact-point NWS active-alert checks for the selected summit
- NWS summit forecast refresh orchestration
- source-specific freshness badges and cached-data age
- automatic refresh while the app is visible
- immediate refresh when the device comes back online or the PWA is resumed
- climb-day weather cadence that becomes more aggressive than normal planning mode
- explicit adapter states for route conditions, trailhead/closure data, camping/permit data, and seasonal avalanche data
- service-worker cache bumped to v1.7 so deployed clients do not remain stuck on v1.6

Recommended production cadences:
- NWS alerts: 5 minutes while active; refresh on app resume/reconnect
- NWS forecast/hourly: 15 minutes on climb day; 60 minutes otherwise
- route/community conditions: 1–2 hours when a trip is near
- trailhead closures/access/fire restrictions: hourly near departure
- camping/permit information: every 6 hours until confirmed; recheck day before
- CAIC: seasonally, after forecast issuance and again before departure when snow is relevant

The static GitHub Pages frontend can directly consume public NWS APIs. Sources that require API keys, normalization, scraping restrictions, cross-origin workarounds, or change detection belong behind the production backend. Do not put private API keys in GitHub Pages JavaScript.


## v1.8 — Unified Explore experience

- Adds `explore.html` with a searchable 58-peak catalogue.
- Each peak opens an immersive Explore page with open-license imagery when available, exact-coordinate NWS weather, nearby-peak bearing/distance exploration, and source-aware route status.
- Planner map previews now include an **Explore peak** action so discovery and planning form one workflow.
- Navigation is reorganized around Discover, Plan, Conditions, and Learn.
- 14ers.com summit panoramas are linked at the source rather than copied into the repository; see `docs/MEDIA_SOURCES.md`.
- Service-worker cache bumped to v1.8 and includes the Explore page.

## v1.8 unified product experience

High Colorado now has one continuous product structure:

- `index.html` — Home / guided entry points
- `explore.html` — all 58 named 14ers, interactive USGS map, Wikimedia Commons open imagery, interactive panorama viewer, summit bearings, live NWS weather
- `planner.html` — map-first multi-peak trip planner and day engine
- `conditions.html` — live NWS forecast + active alerts with explicit source freshness
- `learn.html` — visual class/risk education

### Open media pipeline

`media.js` searches Wikimedia Commons with the MediaWiki Action API, requests image metadata, filters for reusable/public-domain/Creative Commons licenses, and renders photographer/license/source attribution in the interface. High Colorado does not mirror 14ers.com panorama files; their 360° experiences stay linked to the original source.

### Publish

```bash
git add .
git commit -m "Unify High Colorado explore, planning, conditions and open media"
git push
```

## v2.0 Explore / map / weather polish

- Explore Peaks now switches cleanly between an interactive map and photo-rich list view.
- Quick browse categories organize first-14er ideas, hiking routes, scrambling and planner-ready routes.
- Peak map previews include open-license Wikimedia imagery and an explicit close control.
- Peak detail pages include an interactive USGS topo trail/access map. Summit and verified trailhead are shown; route lines remain hidden until verified GPX geometry exists.
- Summit weather now includes current conditions, seven-day NWS forecast, hourly forecast, active alerts and official live NWS radar access.
- Build Trip can start with no objectives, can be cleared back to zero, and can switch between map selection and a photo-card route browser.
- The Build Trip map no longer draws a line between separate mountains. Selected peaks are numbered by trip order only.
- Service-worker cache: `high-colorado-v2.0-explore-weather-maps`.
