# Open media strategy

High Colorado does **not** mirror 14ers.com photographs or panorama assets.

## Wikimedia Commons

`media.js` uses the public MediaWiki Action API at runtime to:

1. search the File namespace for the selected Colorado peak,
2. request thumbnail URLs, dimensions, and `extmetadata`,
3. filter for licenses identified as CC0, CC BY, CC BY-SA / Creative Commons Attribution, or public domain,
4. score images for peak-name relevance, Colorado context, landscape orientation, and panorama keywords,
5. show creator, license, license link (when present), and Commons source link in the UI.

The search is deliberately conservative: if a suitable image is not found, the app retains its branded visual fallback rather than labeling an unrelated mountain as the selected peak.

## Panoramas

A wide open-license image can be displayed in an interactive horizontal drag viewer. This is labeled as a **wide panorama**, not a verified spherical 360°, unless a future curated media record explicitly verifies the asset type.

14ers.com summit panoramas remain external source links. If permission is obtained later, or a verified open spherical panorama is found, the Explore component can be upgraded to a native WebGL panorama viewer without changing the overall peak-page information architecture.

## Offline

Open imagery is currently network-first and is not automatically stored by the app shell service worker. A future explicit “Save trip media offline” action should download only the media attached to the selected trip and preserve attribution metadata beside it.
