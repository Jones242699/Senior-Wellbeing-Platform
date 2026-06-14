export const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 }

/** When DB centers sit in the CBD but the user is far away, first query uses this radius (m). */
export const DEFAULT_SEARCH_RADIUS_METERS = 90000

/** If nothing is returned around the user, query around Melbourne CBD (m) then sort by distance to the user. */
export const CBD_ANCHOR_FALLBACK_RADIUS_METERS = 12000

/** Keep batched distance lookups small enough for the current map adapter. */
export const DISTANCE_BATCH_MAX_DESTINATIONS = 25

export const NEARBY_DISTANCE_METERS = 5000

export const TRAVEL_MODES = [
  { id: 'WALKING', label: 'Walking 🚶' },
  { id: 'BICYCLING', label: 'Cycling 🚲' },
  { id: 'DRIVING', label: 'Driving 🚗' },
  { id: 'TRANSIT', label: 'Transit 🚌' },
]
