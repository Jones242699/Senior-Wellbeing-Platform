export const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 }

export const CITY_OF_MELBOURNE_BOUNDS = {
  minLat: -37.84,
  maxLat: -37.78,
  minLng: 144.9,
  maxLng: 145.02,
}

export const SUPPORTED_AREA_LABEL = 'City of Melbourne'

export const LOCATION_ACCESS_ERROR =
  'Unable to get your location. If no permission prompt appears, click the location or site settings icon in the address bar, allow Location for this site, then press Use Current again.'

export const GEOLOCATION_PERMISSION_ERROR =
  'Location access is blocked or was dismissed. Click the location or site settings icon in the address bar, set Location to Allow for this site, then press Use Current again.'

export const GEOLOCATION_UNAVAILABLE_ERROR =
  'Location permission is allowed, but the browser could not determine your position. Check macOS Location Services for this browser, turn on Wi-Fi if available, or enter a City of Melbourne address manually.'

export const GEOLOCATION_TIMEOUT_ERROR =
  'Location permission is allowed, but finding your position timed out. Try Use Current again, or enter a City of Melbourne address manually.'

export async function getGeolocationPermissionState() {
  if (!navigator.permissions?.query) return ''

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    return permission?.state || ''
  } catch {
    return ''
  }
}

export function getGeolocationErrorMessage(error) {
  if (error?.code === error?.PERMISSION_DENIED || error?.code === 1) {
    return GEOLOCATION_PERMISSION_ERROR
  }
  if (error?.code === error?.POSITION_UNAVAILABLE || error?.code === 2) {
    return GEOLOCATION_UNAVAILABLE_ERROR
  }
  if (error?.code === error?.TIMEOUT || error?.code === 3) {
    return GEOLOCATION_TIMEOUT_ERROR
  }
  return LOCATION_ACCESS_ERROR
}

export function toLatLngLiteral(value) {
  if (!value) return null
  const latRaw = typeof value.lat === 'function' ? value.lat() : value.lat
  const lngRaw = typeof value.lng === 'function' ? value.lng() : value.lng
  if (latRaw === null || latRaw === undefined || lngRaw === null || lngRaw === undefined) {
    return null
  }
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
