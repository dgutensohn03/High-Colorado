# Presenting High Colorado in an Interview

## 30-second pitch
High Colorado is an installable, offline-capable planning application for Colorado 14ers. It combines verified route facts, route difficulty and risk dimensions, summit-coordinate weather, trailhead/access data, an explainable pace model, and multi-peak itineraries. The product is deliberately designed around uncertainty: sourced facts, calculations, suggestions, and unknowns are visually distinct rather than collapsed into an opaque “safety score.”

## 5-minute demo path
1. Select two or three peaks on the map.
2. Reorder the itinerary.
3. Change one start time and pace setting; show summit/return ETA and the confidence band update.
4. Open “Why this estimate” to show explainability.
5. Show landmarks / decision points and Summit Explorer.
6. Save the climb packet offline and explain stale-data timestamps.
7. Install the PWA / show notification opt-in.
8. End on architecture: GitHub Pages + managed backend + service worker + IndexedDB.

## What this demonstrates
- senior frontend architecture
- TypeScript domain modeling
- data visualization / geospatial UX
- accessibility and mobile-first UI
- progressive web app engineering
- offline architecture
- API integration and caching
- authentication / authorization design
- explainable heuristics instead of black-box scoring
- product thinking and safety-aware UX
- CI/CD and public deployment

## Resume bullet draft
Built an installable React/TypeScript PWA for Colorado 14er planning that combines geospatial route data, summit-coordinate weather, explainable pace/ETA modeling, multi-day trip planning, offline climb packets, account sync, and Web Push notifications; deployed through GitHub Actions with a GitHub Pages frontend and managed backend services.
