export const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 }

export const CITY_OF_MELBOURNE_BOUNDS = {
  minLat: -37.84,
  maxLat: -37.78,
  minLng: 144.9,
  maxLng: 145.02,
}

export const SUPPORTED_AREA_LABEL = 'City of Melbourne'

export const LOCATION_ACCESS_ERROR =
  'Unable to get your location. Please allow location access in the browser or enter an address within the City of Melbourne.'

export function toLatLngLiteral(value) {
  if (!value) return null
  const latRaw = typeof value.lat === 'function' ? value.lat() : value.lat
  const lngRaw = typeof value.lng === 'function' ? value.lng() : value.lng
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function isWithinBounds(point, bounds = CITY_OF_MELBOURNE_BOUNDS) {
  const coords = toLatLngLiteral(point)
  if (!coords) return false
  return (
    coords.lat >= bounds.minLat &&
    coords.lat <= bounds.maxLat &&
    coords.lng >= bounds.minLng &&
    coords.lng <= bounds.maxLng
  )
}

export function buildOutsideSupportedAreaMessage(label = 'Location') {
  return `${label} is outside the ${SUPPORTED_AREA_LABEL}. Please enter an address within the ${SUPPORTED_AREA_LABEL}.`
}

export function assertWithinSupportedArea(point, label = 'Location') {
  if (!isWithinBounds(point)) {
    throw new Error(buildOutsideSupportedAreaMessage(label))
  }
  return point
}
