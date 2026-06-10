import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildApiUrl, getApiBase } from '../config/api'

const MELBOURNE_VIEWBOX = '144.2,-37.2,145.9,-38.55'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function toLatLngLiteral(value) {
  if (!value) return null
  const lat = typeof value.lat === 'function' ? value.lat() : value.lat
  const lng = typeof value.lng === 'function' ? value.lng() : value.lng
  const parsedLat = toNumber(lat)
  const parsedLng = toNumber(lng)
  if (parsedLat === null || parsedLng === null) return null
  return { lat: parsedLat, lng: parsedLng }
}

function makeLatLng(lat, lng) {
  const point = typeof lat === 'object' ? toLatLngLiteral(lat) : { lat: Number(lat), lng: Number(lng) }
  const resolved = point || { lat: 0, lng: 0 }
  return {
    lat: () => resolved.lat,
    lng: () => resolved.lng,
    toJSON: () => ({ lat: resolved.lat, lng: resolved.lng }),
  }
}

function buildRoutesGenerateUrl() {
  if (import.meta.env.DEV) return '/__routes/routes/generate'
  return buildApiUrl('/routes/generate', getApiBase(import.meta.env.VITE_ROUTES_API_BASE)).toString()
}

function haversineMeters(a, b) {
  const p1 = toLatLngLiteral(a)
  const p2 = toLatLngLiteral(b)
  if (!p1 || !p2) return Number.POSITIVE_INFINITY
  const radius = 6371000
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const lat1 = toRad(p1.lat)
  const lat2 = toRad(p2.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)))
}

function interpolateLatLng(a, b, fraction) {
  const p1 = toLatLngLiteral(a)
  const p2 = toLatLngLiteral(b)
  if (!p1 || !p2) return makeLatLng(0, 0)
  return makeLatLng(p1.lat + (p2.lat - p1.lat) * fraction, p1.lng + (p2.lng - p1.lng) * fraction)
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${Math.round((meters / 1000) * 10) / 10} km`
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} mins` : `${hours} hr`
}

function markerHtml(label, color) {
  const safeLabel = label ? String(label.text || label) : ''
  const bg = color || '#2563eb'
  return `
    <span style="
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: ${bg};
      color: #fff;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(15,23,42,.24);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
    ">${safeLabel}</span>
  `
}

function makeIcon(options = {}) {
  const color = options.icon?.fillColor || '#2563eb'
  const label = options.label?.text || ''
  return L.divIcon({
    className: 'osm-marker-icon',
    html: markerHtml(label, color),
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

class OsmMap {
  constructor(element, options = {}) {
    const center = toLatLngLiteral(options.center) || { lat: -37.8136, lng: 144.9631 }
    this.leaflet = L.map(element, {
      center: [center.lat, center.lng],
      zoom: options.zoom || 13,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leaflet)
  }

  panTo(position) {
    const point = toLatLngLiteral(position)
    if (point) this.leaflet.panTo([point.lat, point.lng])
  }

  setCenter(position) {
    const point = toLatLngLiteral(position)
    if (point) this.leaflet.setView([point.lat, point.lng], this.leaflet.getZoom())
  }

  setZoom(zoom) {
    this.leaflet.setZoom(zoom)
  }

  getZoom() {
    return this.leaflet.getZoom()
  }

  fitBounds(bounds, padding = 0) {
    const leafletBounds = bounds?.leaflet || bounds
    if (!leafletBounds?.isValid?.()) return
    const pad = Array.isArray(padding) ? padding : [padding || 0, padding || 0]
    this.leaflet.fitBounds(leafletBounds, { padding: pad })
  }
}

class OsmLatLngBounds {
  constructor() {
    this.leaflet = L.latLngBounds()
  }

  extend(position) {
    const point = toLatLngLiteral(position)
    if (point) this.leaflet.extend([point.lat, point.lng])
    return this
  }

  isEmpty() {
    return !this.leaflet.isValid()
  }
}

class OsmMarker {
  constructor(options = {}) {
    const point = toLatLngLiteral(options.position) || { lat: 0, lng: 0 }
    this.options = options
    this.marker = L.marker([point.lat, point.lng], {
      title: options.title,
      icon: makeIcon(options),
      zIndexOffset: options.zIndex || 0,
    })
    this.map = null
    if (options.map) this.setMap(options.map)
  }

  setPosition(position) {
    const point = toLatLngLiteral(position)
    if (point) this.marker.setLatLng([point.lat, point.lng])
  }

  getPosition() {
    const point = this.marker.getLatLng()
    return makeLatLng(point.lat, point.lng)
  }

  setMap(map) {
    if (this.map) this.map.leaflet.removeLayer(this.marker)
    this.map = map || null
    if (map) this.marker.addTo(map.leaflet)
  }

  addListener(eventName, handler) {
    this.marker.on(eventName, handler)
    return { remove: () => this.marker.off(eventName, handler) }
  }

  setAnimation() {}
}

class OsmPolyline {
  constructor(options = {}) {
    this.options = options
    const path = (options.path || []).map(toLatLngLiteral).filter(Boolean)
    this.polyline = L.polyline(
      path.map((p) => [p.lat, p.lng]),
      {
        color: options.strokeColor || '#2563eb',
        weight: options.strokeWeight || 4,
        opacity: options.strokeOpacity ?? 0.9,
      },
    )
    this.map = null
    if (options.map) this.setMap(options.map)
  }

  setMap(map) {
    if (this.map) this.map.leaflet.removeLayer(this.polyline)
    this.map = map || null
    if (map) this.polyline.addTo(map.leaflet)
  }
}

class OsmInfoWindow {
  setContent(content) {
    this.content = content
  }

  open(map, marker) {
    marker?.marker?.bindPopup(this.content || '').openPopup()
    if (!marker && map?.leaflet) L.popup().setLatLng(map.leaflet.getCenter()).setContent(this.content || '').openOn(map.leaflet)
  }
}

async function nominatimSearch(query, limit = 5) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'au',
    limit: String(limit),
    viewbox: MELBOURNE_VIEWBOX,
    bounded: '0',
  })
  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Geocode failed (${response.status})`)
  return response.json()
}

function toPlaceResult(item) {
  const lat = Number(item.lat)
  const lng = Number(item.lon)
  const location = makeLatLng(lat, lng)
  return {
    place_id: item.place_id,
    name: item.name || item.display_name?.split(',')[0] || 'Selected place',
    formatted_address: item.display_name,
    geometry: {
      location,
    },
  }
}

class OsmGeocoder {
  geocode(request, callback) {
    const promise = nominatimSearch(`${request.address || ''} Australia`, 1).then((items) => {
      const results = items.map(toPlaceResult)
      const status = results.length ? 'OK' : 'ZERO_RESULTS'
      if (callback) callback(results, status)
      return { results, status }
    })
    if (callback) {
      promise.catch(() => callback([], 'ERROR'))
      return undefined
    }
    return promise
  }
}

class OsmAutocomplete {
  constructor(input) {
    this.input = input
    this.place = null
    this.listeners = new globalThis.Map()
  }

  addListener(eventName, handler) {
    if (eventName !== 'place_changed') return { remove: () => {} }
    const wrapped = async () => {
      const value = this.input?.value?.trim()
      if (value) {
        try {
          const items = await nominatimSearch(`${value} Australia`, 1)
          this.place = items[0] ? toPlaceResult(items[0]) : null
        } catch {
          this.place = null
        }
      }
      handler()
    }
    this.input?.addEventListener('change', wrapped)
    this.listeners.set(handler, wrapped)
    return { remove: () => this.input?.removeEventListener('change', wrapped) }
  }

  getPlace() {
    return this.place
  }
}

class OsmPlacesService {
  findPlaceFromQuery(request, callback) {
    nominatimSearch(`${request.query || ''} Australia`, 1)
      .then((items) => callback(items.map(toPlaceResult), items.length ? 'OK' : 'ZERO_RESULTS'))
      .catch(() => callback([], 'ERROR'))
  }

  textSearch(request, callback) {
    const query = request.query || ''
    nominatimSearch(`${query} Melbourne Australia`, 20)
      .then((items) => callback(items.map(toPlaceResult), items.length ? 'OK' : 'ZERO_RESULTS'))
      .catch(() => callback([], 'ERROR'))
  }

  getDetails(request, callback) {
    callback(
      {
        place_id: request.placeId,
        name: 'Public Toilet',
        formatted_address: '',
      },
      'OK',
    )
  }
}

function normalizeWaypoint(waypoint) {
  return toLatLngLiteral(waypoint?.location || waypoint)
}

function toDirectionsRoute(route, start, end) {
  const overviewPath = (route.path || []).map((point) => makeLatLng(point.lat, point.lng))
  const bounds = new OsmLatLngBounds()
  overviewPath.forEach((p) => bounds.extend(p))
  return {
    ...route,
    overview_path: overviewPath,
    bounds,
    legs: [
      {
        start_location: makeLatLng(start.lat, start.lng),
        end_location: makeLatLng(end.lat, end.lng),
        distance: route.distance,
        duration: route.duration,
        steps: [],
      },
    ],
  }
}

async function fetchRoute(origin, destination, mode, waypoints = []) {
  const start = toLatLngLiteral(origin)
  const end = toLatLngLiteral(destination)
  if (!start || !end) throw new Error('Invalid route endpoints.')

  const response = await fetch(buildRoutesGenerateUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start,
      destination: end,
      waypoints: waypoints.map(normalizeWaypoint).filter(Boolean),
      travelMode: mode || 'WALKING',
    }),
  })
  if (!response.ok) throw new Error(`Route service failed (${response.status})`)
  const payload = await response.json()
  if (!Array.isArray(payload.routes) || payload.routes.length === 0) {
    throw new Error('No route found. Try another travel mode or adjust locations.')
  }
  return payload.routes.map((route) => toDirectionsRoute(route, start, end))
}

class OsmDirectionsService {
  route(request, callback) {
    const mode = request.travelMode || 'WALKING'
    const promise = fetchRoute(request.origin, request.destination, mode, request.waypoints).then(
      (routes) => ({
        routes,
      }),
    )
    if (callback) {
      promise
        .then((result) => callback(result, 'OK'))
        .catch((error) => callback(null, /No route/i.test(error.message) ? 'ZERO_RESULTS' : 'ERROR'))
      return undefined
    }
    return promise
  }
}

class OsmDirectionsRenderer {
  constructor(options = {}) {
    this.map = options.map || null
    this.options = options
    this.routeIndex = 0
    this.polyline = null
  }

  setMap(map) {
    if (this.polyline) this.polyline.setMap(null)
    this.map = map || null
  }

  setRouteIndex(index) {
    this.routeIndex = index || 0
    if (this.result) this.render()
  }

  setDirections(result) {
    this.result = result
    this.render()
  }

  render() {
    if (this.polyline) this.polyline.setMap(null)
    const route = this.result?.routes?.[this.routeIndex]
    if (!this.map || !route?.overview_path?.length) return
    this.polyline = new OsmPolyline({
      map: this.map,
      path: route.overview_path,
      strokeColor: this.options.polylineOptions?.strokeColor || '#2563eb',
      strokeWeight: this.options.polylineOptions?.strokeWeight || 5,
    })
    this.map.fitBounds(route.bounds, 36)
  }
}

class OsmDistanceMatrixService {
  async getDistanceMatrix(request) {
    const origin = request.origins?.[0]
    const elements = (request.destinations || []).map((destination) => {
      const meters = haversineMeters(origin, destination)
      const seconds = meters / 1.25
      return {
        status: Number.isFinite(meters) ? 'OK' : 'ZERO_RESULTS',
        distance: { text: formatDistance(meters), value: meters },
        duration: { text: formatDuration(seconds), value: seconds },
      }
    })
    return { rows: [{ elements }] }
  }
}

export async function loadOsmMapsApi() {
  if (window.google?.maps?.__osmLeaflet) return window.google.maps

  window.google = window.google || {}
  window.google.maps = {
    __osmLeaflet: true,
    Map: OsmMap,
    Marker: OsmMarker,
    Polyline: OsmPolyline,
    InfoWindow: OsmInfoWindow,
    LatLng: makeLatLng,
    LatLngBounds: OsmLatLngBounds,
    Geocoder: OsmGeocoder,
    DirectionsService: OsmDirectionsService,
    DirectionsRenderer: OsmDirectionsRenderer,
    DistanceMatrixService: OsmDistanceMatrixService,
    SymbolPath: { CIRCLE: 'CIRCLE' },
    Animation: { BOUNCE: 'BOUNCE' },
    DirectionsStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
    GeocoderStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
    TravelMode: {
      WALKING: 'WALKING',
      BICYCLING: 'BICYCLING',
      DRIVING: 'DRIVING',
      TRANSIT: 'TRANSIT',
    },
    UnitSystem: { METRIC: 'METRIC' },
    event: { trigger: () => {} },
    geometry: {
      spherical: {
        computeDistanceBetween: haversineMeters,
        interpolate: interpolateLatLng,
      },
    },
    places: {
      Autocomplete: OsmAutocomplete,
      PlacesService: OsmPlacesService,
      PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
    },
  }
  return window.google.maps
}
