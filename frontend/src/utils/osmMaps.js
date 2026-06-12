import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildApiUrl, getApiBase } from '../config/api'

const geocodeCache = new globalThis.Map()

function buildGeocodeSearchUrl(query, limit) {
  const endpoint = import.meta.env.DEV
    ? new URL('/__geocode/geocode/search', window.location.origin)
    : buildApiUrl('/geocode/search', getApiBase(import.meta.env.VITE_GEOCODE_API_BASE))
  endpoint.searchParams.set('q', query)
  endpoint.searchParams.set('limit', String(limit))
  return endpoint.toString()
}

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

function toLeafletBounds(value) {
  if (!value) return null
  const rawBounds = value.leaflet ? null : value
  if (value.leaflet?.isValid?.()) return value.leaflet

  const south = toNumber(rawBounds?.south ?? rawBounds?.minLat)
  const west = toNumber(rawBounds?.west ?? rawBounds?.minLng)
  const north = toNumber(rawBounds?.north ?? rawBounds?.maxLat)
  const east = toNumber(rawBounds?.east ?? rawBounds?.maxLng)
  if (south === null || west === null || north === null || east === null) return null
  return L.latLngBounds([south, west], [north, east])
}

function addBoundsMask(map, bounds) {
  if (!bounds?.isValid?.()) return

  const south = bounds.getSouth()
  const west = bounds.getWest()
  const north = bounds.getNorth()
  const east = bounds.getEast()
  const world = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
  ]
  const clearArea = [
    [south, west],
    [north, west],
    [north, east],
    [south, east],
  ]

  L.polygon([world, clearArea], {
    stroke: false,
    fillColor: '#0f172a',
    fillOpacity: 0.28,
    interactive: false,
  }).addTo(map)

  L.rectangle(bounds, {
    color: '#16a34a',
    weight: 2,
    opacity: 0.9,
    fill: false,
    interactive: false,
  }).addTo(map)
}

function ensurePane(map, name, zIndex) {
  if (!map?.getPane(name)) {
    map.createPane(name)
  }
  const pane = map.getPane(name)
  if (pane && zIndex !== undefined) pane.style.zIndex = String(zIndex)
  return name
}

class OsmMap {
  constructor(element, options = {}) {
    const center = toLatLngLiteral(options.center) || { lat: -37.8136, lng: 144.9631 }
    const maxBounds = toLeafletBounds(options.restriction?.latLngBounds || options.maxBounds)
    const maskBounds = toLeafletBounds(options.restriction?.maskBounds)
    this.leaflet = L.map(element, {
      center: [center.lat, center.lng],
      zoom: options.zoom || 13,
      minZoom: options.minZoom,
      zoomControl: true,
      maxBounds: maxBounds || undefined,
      maxBoundsViscosity: maxBounds ? 1 : 0,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leaflet)
    addBoundsMask(this.leaflet, maskBounds)
  }

  panTo(position) {
    const point = toLatLngLiteral(position)
    if (point) this.leaflet.panTo([point.lat, point.lng])
  }

  panBy(x, y) {
    const offset = Array.isArray(x) ? x : [x, y]
    this.leaflet.panBy(offset)
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

  setIcon(icon) {
    this.options.icon = icon
    this.marker.setIcon(makeIcon(this.options))
  }

  setZIndex(zIndex) {
    this.marker.setZIndexOffset(zIndex || 0)
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
        interactive: options.clickable !== false,
      },
    )
    this.map = null
    if (options.map) this.setMap(options.map)
  }

  setMap(map) {
    if (this.map) this.map.leaflet.removeLayer(this.polyline)
    this.map = map || null
    if (map) {
      if (this.options.zIndex !== undefined) {
        const zIndex = 650 + Number(this.options.zIndex || 0)
        this.polyline.options.pane = ensurePane(map.leaflet, 'mapPolylinePane', zIndex)
      }
      this.polyline.addTo(map.leaflet)
    }
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

async function geocodeSearch(query, limit = 5) {
  const cacheKey = `${String(query || '').trim().toLowerCase()}::${limit}`
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  const response = await fetch(buildGeocodeSearchUrl(query, limit), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Geocode failed (${response.status})`)
  const payload = await response.json()
  const results = Array.isArray(payload?.results) ? payload.results : []
  geocodeCache.set(cacheKey, results)
  return results
}

function toPlaceResult(item) {
  const lat = Number(item.lat)
  const lng = Number(item.lng)
  const location = makeLatLng(lat, lng)
  return {
    place_id: item.id,
    name: item.name || item.address?.split(',')[0] || 'Selected place',
    formatted_address: item.address,
    geometry: {
      location,
    },
  }
}

class OsmGeocoder {
  geocode(request, callback) {
    const promise = geocodeSearch(request.address || '', 1).then((items) => {
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
    this.suggestions = []
    this.searchSeq = 0
    this.debounceTimer = null
    this.datalist = null
    this.inputHandler = () => this.queueSuggestions()

    if (input && globalThis.document) {
      this.datalist = globalThis.document.createElement('datalist')
      this.datalist.id = `osm-autocomplete-${Math.random().toString(36).slice(2)}`
      input.setAttribute('list', this.datalist.id)
      input.insertAdjacentElement('afterend', this.datalist)
      input.addEventListener('input', this.inputHandler)
    }
  }

  queueSuggestions() {
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer)
    this.debounceTimer = window.setTimeout(() => {
      void this.refreshSuggestions()
    }, 220)
  }

  async refreshSuggestions() {
    const value = this.input?.value?.trim()
    const searchId = ++this.searchSeq
    if (!value || value.length < 2) {
      this.suggestions = []
      this.renderSuggestions()
      return
    }

    try {
      const items = await geocodeSearch(value, 5)
      if (searchId !== this.searchSeq) return
      this.suggestions = items.map(toPlaceResult)
      this.renderSuggestions()
    } catch {
      if (searchId !== this.searchSeq) return
      this.suggestions = []
      this.renderSuggestions()
    }
  }

  renderSuggestions() {
    if (!this.datalist) return
    this.datalist.innerHTML = ''
    this.suggestions.forEach((place) => {
      const option = globalThis.document.createElement('option')
      option.value = place.formatted_address || place.name
      option.label = place.name
      this.datalist.appendChild(option)
    })
  }

  async resolveCurrentValue() {
    const value = this.input?.value?.trim()
    if (!value) {
      this.place = null
      return
    }

    const matchedSuggestion = this.suggestions.find(
      (place) => place.formatted_address === value || place.name === value,
    )
    if (matchedSuggestion) {
      this.place = matchedSuggestion
      return
    }

    try {
      const items = await geocodeSearch(value, 1)
      this.place = items[0] ? toPlaceResult(items[0]) : null
    } catch {
      this.place = null
    }
  }

  addListener(eventName, handler) {
    if (eventName !== 'place_changed') return { remove: () => {} }
    const wrapped = async () => {
      await this.resolveCurrentValue()
      handler()
    }
    const keydownWrapped = async (event) => {
      if (event.key !== 'Enter') return
      await wrapped()
    }
    this.input?.addEventListener('change', wrapped)
    this.input?.addEventListener('keydown', keydownWrapped)
    this.listeners.set(handler, { wrapped, keydownWrapped })
    return {
      remove: () => {
        this.input?.removeEventListener('change', wrapped)
        this.input?.removeEventListener('keydown', keydownWrapped)
      },
    }
  }

  getPlace() {
    return this.place
  }
}

class OsmPlacesService {
  findPlaceFromQuery(request, callback) {
    geocodeSearch(request.query || '', 1)
      .then((items) => callback(items.map(toPlaceResult), items.length ? 'OK' : 'ZERO_RESULTS'))
      .catch(() => callback([], 'ERROR'))
  }

  textSearch(request, callback) {
    const query = request.query || ''
    geocodeSearch(query, 20)
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

const OSM_MAP_API = {
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

export async function loadOsmMapsApi() {
  return OSM_MAP_API
}

export async function loadMapApi() {
  return OSM_MAP_API
}
