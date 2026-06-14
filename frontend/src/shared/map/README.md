# Shared Map Layer

This folder contains the shared frontend map primitives used by feature pages.

The low-level adapter is `frontend/src/utils/osmMaps.js`. It exposes a Google Maps-like API backed by OpenStreetMap/Leaflet, so feature code can continue to use concepts such as `Map`, `Marker`, `DirectionsService`, `DirectionsRenderer`, `PlacesService`, and `Autocomplete` without depending directly on Leaflet.

## Files

- `useBaseMap.js`
  - Owns common map lifecycle setup.
  - Creates shared map services: geocoder, directions service, directions renderer, places service, and info window.
  - Provides common actions such as `panTo`, `resizeMap`, `directionsRoute`, `setDirectionsResult`, `clearDirectionsDisplay`, user marker, endpoint markers, and cleanup.

- `markerHelpers.js`
  - Provides small marker helpers for feature composables.
  - Use `createMapMarker` for custom marker icons.
  - Use `createCircleMarker` for standard colored circle markers.
  - Use `clearMarkers` for marker arrays owned by a feature.

- `placeHelpers.js`
  - Provides shared place and autocomplete helpers.
  - Use `setupPlaceAutocomplete` for input autocomplete wiring.
  - Use `resolvePlaceFromQuery` for Places text lookup.
  - Use `toPlacePoint` to normalize a place result into lat/lng and display text.

- `mapStyles.css`
  - Provides shared map surface, canvas, loading mask, Leaflet pane z-index, legend, dot, and pin primitives.
  - Feature stylesheets should keep page layout, marker color meaning, and feature-specific overlays.

## Feature Boundaries

Shared map code should stay focused on generic map primitives. Feature-specific behavior should remain inside feature modules.

Keep these in feature code:

- Discover category marker colors, active marker behavior, crowd density overlay, and place cards.
- My Routes facility fetching, toilet/bench popup content, route preferences, and route summary.
- Mental Support counseling room data, address filter state, location workflow, and travel mode routing.

When adding new shared map code, prefer small helpers that preserve existing feature behavior rather than broad abstractions that force pages into the same UI or data model.
