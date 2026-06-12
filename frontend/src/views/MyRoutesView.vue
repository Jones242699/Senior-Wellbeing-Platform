<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getApiBase } from '../config/api'
import { loadMapApi } from '../utils/osmMaps'

const route = useRoute()

const mapContainerRef = ref(null)
const startInputRef = ref(null)
const destInputRef = ref(null)
const mapReady = ref(false)

const startLocation = ref('')
const destination = ref('')
const travelMode = ref(null)
const originMode = ref('manual') // 'manual' | 'current'

const routeError = ref('')
const routeSummary = ref('')
const routing = ref(false)
const loadingFacilities = ref(false)
const preferencesDirty = ref(false)

const socialDensity = ref('normal') // 'busy' | 'normal' | 'quiet' (UI only)
const shadeLevel = ref('normal') // 'more' | 'normal' | 'less' (UI only)
const noToiletsFound = ref(false)
const noBenchesFound = ref(false)
const facilityCounts = ref({ toilets: 0, benches: 0 })

/** @type {{ lat: number, lng: number } | null} */
const userLatLng = ref(null)

let startPlace = null
let endPlace = null

let mapApi
let map
let geocoder
let directionsService
let directionsRenderer
let placesService
let infoWindow
let toiletMarkers = []
let benchMarkers = []
let userMarker
let startMarker
let destMarker
let startAutocomplete
let endAutocomplete
/** @type {number | null} */
let geoWatchId = null

const TRAVEL_MODES = [
  { id: 'WALKING', label: 'Walking 🚶' },
  { id: 'BICYCLING', label: 'Cycling 🚲' },
  { id: 'DRIVING', label: 'Driving 🚗' },
]

const MELBOURNE = { lat: -37.8136, lng: 144.9631 }
const CITY_OF_MELBOURNE_BOUNDS = {
  minLat: -37.84,
  maxLat: -37.78,
  minLng: 144.9,
  maxLng: 145.02,
}
const CITY_OF_MELBOURNE_MAP_BOUNDS = {
  south: -37.845,
  north: -37.775,
  west: 144.895,
  east: 145.025,
}

/** Cap bench markers on the map so dense datasets stay readable; full along-route set still drives alerts. */
const MAX_BENCH_MARKERS_ON_ROUTE_MAP = 32
const ROUTE_FACILITIES_DISTANCE_METERS = 10

function toLatLngLiteral(value) {
  if (!value) return null
  const latRaw = typeof value.lat === 'function' ? value.lat() : value.lat
  const lngRaw = typeof value.lng === 'function' ? value.lng() : value.lng
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function isWithinBounds(point, bounds) {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  )
}

function assertWithinMelbourne(point, label) {
  const coords = toLatLngLiteral(point)
  if (!coords || !isWithinBounds(coords, CITY_OF_MELBOURNE_BOUNDS)) {
    throw new Error(
      `${label} is outside the City of Melbourne. Please enter an address within the City of Melbourne.`,
    )
  }
  return point
}

function ensureUserMarker(position) {
  if (!map || !mapApi) return

  if (userMarker) {
    userMarker.setPosition(position)
    userMarker.setMap(map)
  } else {
    userMarker = new mapApi.Marker({
      map,
      position,
      title: 'Your location',
      zIndex: 999,
      icon: {
        path: mapApi.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    })
  }
}

function setEndpointMarker(kind, position) {
  if (!map || !mapApi) return

  const isStart = kind === 'start'
  const label = isStart ? 'S' : 'D'
  const markerRef = isStart ? startMarker : destMarker

  const icon = {
    path: mapApi.SymbolPath.CIRCLE,
    scale: 13,
    fillColor: '#dc2626',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
  }

  if (markerRef) {
    markerRef.setPosition(position)
    markerRef.setMap(map)
    return
  }

  const marker = new mapApi.Marker({
    map,
    position,
    zIndex: 900,
    icon,
    label: {
      text: label,
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '800',
    },
  })

  if (isStart) startMarker = marker
  else destMarker = marker
}

function watchPositionIfSupported() {
  if (!navigator.geolocation?.watchPosition) return

  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId)
    geoWatchId = null
  }

  geoWatchId = navigator.geolocation.watchPosition(
    ({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude }
      userLatLng.value = pos
      ensureUserMarker(pos)
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  )
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        userLatLng.value = pos
        ensureUserMarker(pos)
        resolve(pos)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        reject(
          new Error(
            'Unable to get your location. Please allow location access in the browser or enter the start manually.',
          ),
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  })
}

function setupAutocomplete() {
  const startEl = startInputRef.value
  const endEl = destInputRef.value
  if (!startEl || !endEl || !mapApi?.places) return

  startAutocomplete = new mapApi.places.Autocomplete(startEl, {
    fields: ['geometry', 'formatted_address', 'name'],
    componentRestrictions: { country: 'au' },
  })
  endAutocomplete = new mapApi.places.Autocomplete(endEl, {
    fields: ['geometry', 'formatted_address', 'name'],
    componentRestrictions: { country: 'au' },
  })

  startAutocomplete.addListener('place_changed', () => {
    const p = startAutocomplete.getPlace()
    startPlace = p?.geometry?.location ? p : null
    if (p?.formatted_address) startLocation.value = p.formatted_address
    originMode.value = 'manual'
  })

  endAutocomplete.addListener('place_changed', () => {
    const p = endAutocomplete.getPlace()
    endPlace = p?.geometry?.location ? p : null
    if (p?.formatted_address) destination.value = p.formatted_address
  })
}

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address, region: 'au' }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        resolve({
          location: results[0].geometry.location,
          formattedAddress: results[0].formatted_address || address,
        })
        return
      }
      reject(new Error(`Geocode failed (${status || 'UNKNOWN'})`))
    })
  })
}

function findPlaceByText(address) {
  return new Promise((resolve, reject) => {
    if (!placesService || !mapApi?.places) {
      reject(new Error('Places service unavailable'))
      return
    }
    placesService.findPlaceFromQuery(
      {
        query: address,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (results, status) => {
        if (
          status === mapApi.places.PlacesServiceStatus.OK &&
          Array.isArray(results) &&
          results[0]?.geometry?.location
        ) {
          resolve({
            location: results[0].geometry.location,
            formattedAddress: results[0].formatted_address || address,
            name: results[0].name || address,
          })
          return
        }
        reject(new Error(`Place lookup failed (${status || 'UNKNOWN'})`))
      },
    )
  })
}

function buildAddressCandidates(address) {
  const raw = String(address || '').trim()
  if (!raw) return []
  const candidates = [raw]

  // Remove relative-position descriptors often included by backend text.
  const withoutRelativePrefix = raw.replace(
    /.*?\b(?:approximately|approx\.?|about)\b[^,]*\b(?:of|from)\b\s*/i,
    '',
  )
  if (withoutRelativePrefix && withoutRelativePrefix !== raw) candidates.push(withoutRelativePrefix.trim())

  // Keep the street-address tail when the string contains landmark prose.
  const addressTailMatch = raw.match(/\d+\s+[^,]+(?:,\s*[^,]+){1,4}/)
  if (addressTailMatch?.[0]) candidates.push(addressTailMatch[0].trim())

  return [...new Set(candidates)]
}

async function geocodeToLatLng(address) {
  const candidates = buildAddressCandidates(address)
  for (const candidate of candidates) {
    try {
      return await geocodeAddress(candidate)
    } catch {
      // try next candidate
    }
  }

  for (const candidate of candidates) {
    try {
      return await findPlaceByText(candidate)
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Unable to resolve address: "${address}". Please select an autocomplete suggestion or check spelling.`,
  )
}

function parseQueryLatLng(rawLat, rawLng) {
  const lat = Number(rawLat)
  const lng = Number(rawLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function normalizePlaceFromResolvedLocation(location, formattedAddress, rawText) {
  return {
    geometry: { location },
    formatted_address: formattedAddress || rawText,
    name: rawText,
  }
}

async function resolveOrigin() {
  const text = startLocation.value.trim()

  if (originMode.value === 'current' || !text || /^current\s*location$/i.test(text)) {
    if (userLatLng.value) return assertWithinMelbourne(userLatLng.value, 'Start location')

    const pos = await requestCurrentPosition()
    assertWithinMelbourne(pos, 'Start location')
    map.panTo(pos)
    map.setZoom(16)
    watchPositionIfSupported()
    return pos
  }

  if (startPlace?.geometry?.location) {
    return assertWithinMelbourne(startPlace.geometry.location, 'Start location')
  }

  if (!text) {
    throw new Error('Please enter a start location or click "Use My Location".')
  }

  const resolved = await geocodeToLatLng(text)
  return assertWithinMelbourne(resolved.location, 'Start location')
}

async function resolveDestination() {
  if (endPlace?.geometry?.location) {
    return assertWithinMelbourne(endPlace.geometry.location, 'Destination')
  }

  const text = destination.value.trim()
  if (!text) {
    throw new Error('Please enter a destination.')
  }

  const resolved = await geocodeToLatLng(text)
  if (!endPlace?.geometry?.location) {
    endPlace = normalizePlaceFromResolvedLocation(
      resolved.location,
      resolved.formattedAddress,
      resolved.name || text,
    )
    destination.value = resolved.formattedAddress || text
  }
  return assertWithinMelbourne(resolved.location, 'Destination')
}

function directionsRoute(request) {
  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === mapApi.DirectionsStatus.OK && result) {
        resolve(result)
      } else {
        const msg =
          status === mapApi.DirectionsStatus.ZERO_RESULTS
            ? 'No route found. Try another travel mode or adjust locations.'
            : `Route planning failed (${status}).`
        reject(new Error(msg))
      }
    })
  })
}

/** Clear polyline from map; `setDirections(null)` throws InvalidValueError in Maps JS API. */
function clearDirectionsDisplay() {
  if (!directionsRenderer) return
  directionsRenderer.setDirections({ routes: [] })
}

function initMap() {
  map = new mapApi.Map(mapContainerRef.value, {
    center: MELBOURNE,
    zoom: 14,
    minZoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    restriction: {
      latLngBounds: CITY_OF_MELBOURNE_MAP_BOUNDS,
      maskBounds: CITY_OF_MELBOURNE_BOUNDS,
    },
  })

  geocoder = new mapApi.Geocoder()
  directionsService = new mapApi.DirectionsService()
  directionsRenderer = new mapApi.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#16a34a',
      strokeWeight: 5,
    },
  })
  placesService = new mapApi.places.PlacesService(map)
  infoWindow = new mapApi.InfoWindow()
}

function clearToiletMarkers() {
  for (const marker of toiletMarkers) {
    if (marker) marker.setMap(null)
  }
  toiletMarkers = []
}

function createToiletMarker(toilet) {
  if (!toilet.latitude || !toilet.longitude) return
  const position = {
    lat: Number(toilet.latitude),
    lng: Number(toilet.longitude),
  }
  if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return

  const marker = new mapApi.Marker({
    map,
    position,
    title: toilet.name || 'Public Toilet',
    zIndex: 800,
    icon: {
      path: 'M -1.5,-1.5 L 1.5,-1.5 L 1.5,1.5 L -1.5,1.5 z',
      scale: 10,
      fillOpacity: 0,
      strokeWeight: 0,
    },
    label: {
      text: '🚻',
      color: '#1f2937',
      fontSize: '16px',
      fontWeight: '800',
    },
  })

  marker.addListener('click', () => {
    const access = [
      toilet.female_access ? `Female: ${toilet.female_access}` : '',
      toilet.male_access ? `Male: ${toilet.male_access}` : '',
      toilet.wheelchair_access ? `Wheelchair: ${toilet.wheelchair_access}` : '',
      toilet.baby_facilities ? `Baby facilities: ${toilet.baby_facilities}` : '',
    ].filter(Boolean)

    infoWindow.setContent(`
      <div style="font-family: inherit; color: #1e293b; padding: 4px; max-width: 260px;">
        <strong style="display: block; margin-bottom: 4px; font-size: 15px;">${toilet.name || 'Public Toilet'}</strong>
        <div style="font-size: 12px; color: #64748b;">${toilet.operator || 'Public facility'}</div>
        ${
          access.length
            ? `<ul style="font-size: 12px; padding-left: 16px; margin: 8px 0 0;">${access
                .map((item) => `<li>${item}</li>`)
                .join('')}</ul>`
            : ''
        }
      </div>
    `)
    infoWindow.open(map, marker)
  })

  toiletMarkers.push(marker)
}

function getRoutePath(route) {
  if (!route) return []

  const points = []
  if (route.legs?.length) {
    for (const leg of route.legs) {
      if (!leg.steps?.length) continue
      for (const step of leg.steps) {
        if (step.path?.length) points.push(...step.path)
      }
    }
  }

  // Use detailed step paths first; fallback to overview path when needed.
  return points.length > 0 ? points : route.overview_path || []
}

function clearBenchMarkers() {
  for (const marker of benchMarkers) {
    if (marker) marker.setMap(null)
  }
  benchMarkers = []
}

function buildRouteFacilitiesFetchUrl() {
  if (import.meta.env.DEV) {
    return '/__route-facilities/route-facilities'
  }
  const base = getApiBase(import.meta.env.VITE_ROUTE_FACILITIES_API_BASE)
  return `${base}/route-facilities`
}

function createBenchMarker(bench) {
  if (!bench.lat || !bench.lng) return

  const marker = new mapApi.Marker({
    map,
    position: { lat: parseFloat(bench.lat), lng: parseFloat(bench.lng) },
    title: bench.desc || 'Rest Bench',
    zIndex: 750,
    icon: {
      path: mapApi.SymbolPath.CIRCLE,
      scale: 14,
      fillColor: '#d99a2b',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
    label: {
      text: 'B',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: '800',
    },
  })

  marker.addListener('click', () => {
    infoWindow.setContent(`
      <div style="font-family: inherit; color: #1e293b; padding: 4px; max-width: 200px;">
        <strong style="display: block; margin-bottom: 4px; font-size: 14px;">Rest Bench</strong>
        <p style="font-size: 12px; margin: 0; color: #64748b;">${bench.desc || 'A place to rest along your journey.'}</p>
      </div>
    `)
    infoWindow.open(map, marker)
  })

  benchMarkers.push(marker)
}

async function fetchFacilitiesForRoute(route) {
  clearBenchMarkers()
  clearToiletMarkers()
  facilityCounts.value = { toilets: 0, benches: 0 }
  loadingFacilities.value = true
  if (!route) {
    noBenchesFound.value = true
    noToiletsFound.value = true
    loadingFacilities.value = false
    return
  }

  const routePath = getRoutePath(route)
  if (routePath.length === 0) {
    noBenchesFound.value = true
    noToiletsFound.value = true
    loadingFacilities.value = false
    return
  }

  try {
    const path = routePath.map((point) => ({
      lat: typeof point.lat === 'function' ? point.lat() : point.lat,
      lng: typeof point.lng === 'function' ? point.lng() : point.lng,
    }))
    const response = await fetch(buildRouteFacilitiesFetchUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        distanceMeters: ROUTE_FACILITIES_DISTANCE_METERS,
        limitPerType: 80,
      }),
    })
    if (!response.ok) throw new Error(`Failed to fetch route facilities (HTTP ${response.status})`)
    const payload = await response.json()
    if (
      payload?.status !== 'success' ||
      !Array.isArray(payload?.benches) ||
      !Array.isArray(payload?.toilets)
    ) {
      throw new Error('Unexpected route facilities API response')
    }

    const nearbyBenches = payload.benches.map((row) => ({
      lat: row.latitude,
      lng: row.longitude,
      desc: row.description ?? '',
      type: row.type,
      condition: row.condition,
      distanceMeters: row.distance_meters,
    }))
    const nearbyToilets = payload.toilets

    noToiletsFound.value = nearbyToilets.length === 0
    noBenchesFound.value = nearbyBenches.length === 0
    facilityCounts.value = {
      toilets: nearbyToilets.length,
      benches: nearbyBenches.length,
    }
    nearbyToilets.forEach((toilet) => createToiletMarker(toilet))

    let benchesToPlot = nearbyBenches
    if (nearbyBenches.length > MAX_BENCH_MARKERS_ON_ROUTE_MAP) {
      benchesToPlot = [...nearbyBenches]
      for (let i = benchesToPlot.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[benchesToPlot[i], benchesToPlot[j]] = [benchesToPlot[j], benchesToPlot[i]]
      }
      benchesToPlot = benchesToPlot.slice(0, MAX_BENCH_MARKERS_ON_ROUTE_MAP)
    }
    benchesToPlot.forEach((bench) => createBenchMarker(bench))
  } catch (error) {
    console.error('[Route Facilities] Error fetching facilities:', error)
    noBenchesFound.value = true
    noToiletsFound.value = true
  } finally {
    loadingFacilities.value = false
  }
}

function onStartInput() {
  startPlace = null
  originMode.value = 'manual'
}

function onDestInput() {
  endPlace = null
}

async function onTravelModeChange(modeId) {
  travelMode.value = modeId
  if (!destination.value.trim() && !endPlace?.geometry?.location) return
  await generateRoute()
}

function setSocialDensity(value) {
  socialDensity.value = value
  preferencesDirty.value = true
}

function setShadeLevel(value) {
  shadeLevel.value = value
  preferencesDirty.value = true
}

function useMyLocation() {
  routeError.value = ''
  originMode.value = 'current'
  startPlace = null
  startLocation.value = 'Current location'

  const continueRouting = async () => {
    if (travelMode.value && (destination.value.trim() || endPlace)) {
      await generateRoute()
    }
  }

  if (userLatLng.value) {
    map.panTo(userLatLng.value)
    map.setZoom(16)
    watchPositionIfSupported()
    continueRouting()
    return
  }

  requestCurrentPosition()
    .then(async (pos) => {
      map.panTo(pos)
      map.setZoom(16)
      watchPositionIfSupported()
      continueRouting()
    })
    .catch((e) => {
      originMode.value = 'manual'
      routeError.value =
        e?.message ||
        'Unable to get your location. Please allow location access in the browser or enter the start manually.'
    })
}

async function generateRoute() {
  routeError.value = ''
  routeSummary.value = ''
  noToiletsFound.value = false
  noBenchesFound.value = false
  facilityCounts.value = { toilets: 0, benches: 0 }

  if (!directionsService || !directionsRenderer) return

  routing.value = true
  try {
    if (!travelMode.value) {
      throw new Error('Please select a travel mode first.')
    }

    const origin = await resolveOrigin()
    const dest = await resolveDestination()

    const mode = mapApi.TravelMode[travelMode.value]
    if (mode === undefined) {
      throw new Error('Unsupported travel mode')
    }

    const request = {
      origin,
      destination: dest,
      travelMode: mode,
      region: 'au',
    }

    const result = await directionsRoute(request)

    // Select route based on socialDensity and shadeLevel preferences
    let bestRouteIndex = 0

    if (
      result.routes.length > 1 &&
      (socialDensity.value !== 'normal' || shadeLevel.value !== 'normal')
    ) {

      const scores = result.routes.map((route, index) => ({
        index,
        shadeScore: route.shadeScore ?? 0,
        socialScore: route.socialScore ?? 0,
        overallScore: route.overallScore ?? 0,
      }))

      // Ranking logic
      scores.sort((a, b) => {
        if (shadeLevel.value !== 'normal') {
          return shadeLevel.value === 'more'
            ? b.shadeScore - a.shadeScore
            : a.shadeScore - b.shadeScore
        }

        if (socialDensity.value === 'busy') {
          return b.socialScore - a.socialScore
        }

        if (socialDensity.value === 'quiet') {
          return a.socialScore - b.socialScore
        }

        return b.overallScore - a.overallScore
      })

      bestRouteIndex = scores[0].index
      const bestScore = scores[0]
      console.log(
        `[Route Selection] Preferences: Social=${socialDensity.value}, Shade=${shadeLevel.value}`,
      )
      console.log(
        `[Route Selection] Best Route Selected Index: ${bestRouteIndex} (Shade: ${bestScore.shadeScore}%, Social: ${bestScore.socialScore}%)`,
      )
    }

    directionsRenderer.setDirections(result)
    directionsRenderer.setRouteIndex(bestRouteIndex)

    const route = result.routes?.[bestRouteIndex]
    const leg = route?.legs?.[0]
    if (leg) {
      const dist = leg.distance?.text ?? ''
      const dur = leg.duration?.text ?? ''

      let preferenceLabel = ''
      if (shadeLevel.value !== 'normal') {
        preferenceLabel += ` · ${shadeLevel.value === 'more' ? '🌲 High' : '☀️ Low'} Shade`
      }
      if (socialDensity.value !== 'normal') {
        preferenceLabel += ` · ${socialDensity.value === 'quiet' ? 'Quiet' : 'Busy'}`
      }

      routeSummary.value = dist && dur ? `${dist} · ${dur}${preferenceLabel}` : dist || dur

      setEndpointMarker('start', leg.start_location)
      setEndpointMarker('dest', leg.end_location)
    }

    void fetchFacilitiesForRoute(route)

    preferencesDirty.value = false
  } catch (e) {
    routeError.value = e?.message || 'Failed to generate route'
    clearDirectionsDisplay()
    clearToiletMarkers()
    if (startMarker) startMarker.setMap(null)
    if (destMarker) destMarker.setMap(null)
  } finally {
    routing.value = false
  }
}

onMounted(async () => {
  const destinationPointFromQuery = parseQueryLatLng(
    route.query.destinationLat,
    route.query.destinationLng,
  )
  const destinationFromQuery = String(
    route.query.destinationAddress || route.query.destination || '',
  ).trim()
  if (destinationFromQuery) {
    destination.value = destinationFromQuery
    endPlace = null
  }

  try {
    mapApi = await loadMapApi()
    initMap()
    await nextTick()
    setupAutocomplete()
    if (destinationPointFromQuery) {
      const presetLocation = new mapApi.LatLng(
        destinationPointFromQuery.lat,
        destinationPointFromQuery.lng,
      )
      endPlace = normalizePlaceFromResolvedLocation(
        presetLocation,
        destinationFromQuery,
        destinationFromQuery || 'Selected destination',
      )
    }
    mapReady.value = true
  } catch (err) {
    console.error(err)
    routeError.value = err?.message || 'Failed to load map'
  }
})

onUnmounted(() => {
  if (geoWatchId !== null && navigator.geolocation?.clearWatch) {
    navigator.geolocation.clearWatch(geoWatchId)
    geoWatchId = null
  }
  clearToiletMarkers()
  clearBenchMarkers()
  if (userMarker) userMarker.setMap(null)
  userMarker = null
  if (startMarker) startMarker.setMap(null)
  startMarker = null
  if (destMarker) destMarker.setMap(null)
  destMarker = null
  directionsRenderer?.setMap(null)
  directionsRenderer = null
})
</script>

<template>
  <div class="my-routes-page">
    <aside class="sidebar">
      <header class="sidebar-header">
        <router-link to="/" class="back-link" title="Back to Home">
          <span class="back-icon">←</span>
        </router-link>
        <h1 class="page-title">Plan Your Route</h1>
      </header>

      <div class="form-group">
        <label class="form-label label-green">A Start</label>
        <div class="input-row">
          <div class="input-icon-wrapper">
            <span class="icon-magnify" aria-hidden="true">🔍</span>
            <input
              ref="startInputRef"
              v-model="startLocation"
              type="text"
              placeholder="Where do you start from?"
              autocomplete="off"
              @input="onStartInput"
            />
          </div>
          <button type="button" class="btn-sm btn-green" @click="useMyLocation">
            Use My Location
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label-green">B Destination</label>
        <div class="input-row">
          <div class="input-icon-wrapper">
            <span class="icon-magnify" aria-hidden="true">🔍</span>
            <input
              ref="destInputRef"
              v-model="destination"
              type="text"
              placeholder="Where do you want to go?"
              autocomplete="off"
              @input="onDestInput"
            />
          </div>
        </div>
      </div>

      <div class="form-group">
        <span class="form-label label-mode">Travel Mode</span>
        <div class="mode-toolbar">
          <div class="mode-row">
            <button
              v-for="m in TRAVEL_MODES"
              :key="m.id"
              type="button"
              :class="['mode-chip', { active: travelMode === m.id }]"
              @click="onTravelModeChange(m.id)"
            >
              {{ m.label }}
            </button>
          </div>
          <span v-show="routing" class="mode-spinner" aria-hidden="true" title="Updating route" />
        </div>
      </div>

      <p v-if="routeSummary" class="route-summary">Estimate: {{ routeSummary }}</p>

      <div
        v-if="routeSummary || loadingFacilities || facilityCounts.toilets || facilityCounts.benches"
        class="facility-summary"
      >
        <div class="facility-summary-item">
          <span class="facility-summary-icon toilet-summary-icon">🚻</span>
          <span>{{ loadingFacilities ? 'Checking toilets...' : `${facilityCounts.toilets} toilets near route` }}</span>
        </div>
        <div class="facility-summary-item">
          <span class="facility-summary-icon bench-summary-icon">B</span>
          <span>{{ loadingFacilities ? 'Checking benches...' : `${facilityCounts.benches} benches near route` }}</span>
        </div>
      </div>

      <p v-if="routeError" class="route-error">{{ routeError }}</p>

      <div v-if="noToiletsFound || noBenchesFound" class="route-alerts">
        <div v-if="noToiletsFound" class="alert-card warning">
          <span class="alert-icon" aria-hidden="true">⚠️</span>
          <div class="alert-content">
            <strong class="alert-title">Route notice: no public toilets</strong>
            <p class="alert-desc">
              No public toilets were found along this route. Please plan ahead.
            </p>
          </div>
        </div>
        <div v-if="noBenchesFound" class="alert-card warning">
          <span class="alert-icon" aria-hidden="true">⚠️</span>
          <div class="alert-content">
            <strong class="alert-title">Route notice: no rest benches</strong>
            <p class="alert-desc">No rest benches were found along this route.</p>
          </div>
        </div>
      </div>

      <section class="prefs">
        <h2 class="prefs-title">Route Preferences</h2>

        <div class="pref-card">
          <div class="pref-left">
            <div class="pref-name">Socially Active</div>
            <div class="pref-desc">Show routes with higher pedestrian density</div>
          </div>
          <div class="pref-actions" role="group" aria-label="Socially Active preference">
            <button
              type="button"
              :class="['pref-icon', { active: socialDensity === 'busy' }]"
              aria-label="Busy route"
              title="Busy"
              @click="setSocialDensity('busy')"
            >
              busy
            </button>
            <button
              type="button"
              :class="['pref-mid', { active: socialDensity === 'normal' }]"
              aria-label="Normal route"
              title="Normal"
              @click="setSocialDensity('normal')"
            >
              medium
            </button>
            <button
              type="button"
              :class="['pref-icon', { active: socialDensity === 'quiet' }]"
              aria-label="Quiet route"
              title="Quiet"
              @click="setSocialDensity('quiet')"
            >
              quiet
            </button>
          </div>
        </div>

        <div class="pref-card">
          <div class="pref-left">
            <div class="pref-name">Nature & Shade</div>
            <div class="pref-desc">Show routes with more tree shade</div>
          </div>
          <div class="pref-actions" role="group" aria-label="Nature & Shade preference">
            <button
              type="button"
              :class="['pref-icon', { active: shadeLevel === 'more' }]"
              aria-label="More shade"
              title="More shade"
              @click="setShadeLevel('more')"
            >
              high
            </button>
            <button
              type="button"
              :class="['pref-mid', { active: shadeLevel === 'normal' }]"
              aria-label="Normal shade"
              title="Normal"
              @click="setShadeLevel('normal')"
            >
              medium
            </button>
            <button
              type="button"
              :class="['pref-icon', { active: shadeLevel === 'less' }]"
              aria-label="Less shade"
              title="Less shade"
              @click="setShadeLevel('less')"
            >
              low
            </button>
          </div>
        </div>
        <button
          type="button"
          class="btn-generate btn-generate-prefs"
          :disabled="routing"
          @click="generateRoute"
        >
          {{
            routing
              ? 'Routing...'
              : preferencesDirty
                ? 'Generate Route — apply preferences'
                : 'Generate Route'
          }}
        </button>
      </section>
    </aside>

    <main class="map-container">
      <div ref="mapContainerRef" class="map-view"></div>

      <div v-if="!mapReady" class="map-loading-mask">Loading map…</div>

      <div class="legend-box">
        <h4>Legend</h4>
        <div class="legend-item">
          <span class="legend-facility toilet-icon">🚻</span>
          <span>Public Toilet</span>
        </div>
        <div class="legend-item">
          <span class="legend-facility bench-icon">B</span>
          <span>Rest Bench</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot user-dot"></span>
          <span>My Location</span>
        </div>
        <div class="legend-item">
          <span class="legend-color route-color"></span>
          <span>Planned Route</span>
        </div>
        <div class="legend-item">
          <span class="legend-pin start-pin">S</span>
          <span>Start</span>
        </div>
        <div class="legend-item">
          <span class="legend-pin end-pin">D</span>
          <span>Destination</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.my-routes-page {
  display: flex;
  min-height: calc(100vh - 64px);
  background: #f8fafc;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.sidebar {
  width: 420px;
  background: #f8fafc;
  padding: 32px;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  order: 2;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-link:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
  font-weight: 700;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}
.label-green {
  color: #16a34a;
}
.label-mode {
  color: #334155;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-icon-wrapper {
  position: relative;
  flex: 1;
}

.input-icon-wrapper input {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 14px 12px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  background: #fff;
  transition: all 0.2s;
}

.input-icon-wrapper input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}

.icon-magnify {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #94a3b8;
}

.btn-sm {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-green {
  background: #16a34a;
  color: white;
}
.btn-green:hover {
  background: #15803d;
}

.mode-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.mode-chip {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.mode-chip.active {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.mode-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: mode-spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes mode-spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-generate {
  width: 100%;
  max-width: 220px;
  padding: 14px;
  background: #16a34a;
  color: white;
  font-weight: 700;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 16px;
  transition: background 0.2s;
}

.btn-generate-prefs {
  max-width: none;
  width: 100%;
  margin-top: 14px;
  margin-bottom: 0;
  white-space: nowrap;
  font-size: 13px;
  padding: 12px 16px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-generate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-generate:hover:not(:disabled) {
  background: #15803d;
}

.route-summary {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #166534;
  line-height: 1.4;
}

.facility-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid #d9e5d8;
  border-radius: 10px;
  background: #ffffff;
}

.facility-summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.facility-summary-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
}

.toilet-summary-icon {
  color: #1f2937;
  background: #eef2f7;
}

.bench-summary-icon {
  color: #ffffff;
  background: #d99a2b;
}

.route-error {
  margin: 0 0 8px;
  font-size: 13px;
  color: #b91c1c;
}

.prefs {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.prefs-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.pref-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #c9dbc7;
  border-radius: 12px;
  padding: 14px 12px;
  margin-bottom: 12px;
  color: #1f3b2f;
}

.pref-left {
  min-width: 0;
}

.pref-name {
  font-weight: 800;
  font-size: 15px;
  line-height: 1.2;
}

.pref-desc {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.95;
  line-height: 1.3;
}

.pref-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.pref-icon,
.pref-mid {
  border: 1px solid #9bb79c;
  background: #dbe8d8;
  color: #1f3b2f;
  border-radius: 10px;
  cursor: pointer;
  min-width: 56px;
  height: 38px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  display: grid;
  place-items: center;
  text-transform: lowercase;
}

.pref-icon {
  min-width: 56px;
}

.pref-mid {
  min-width: 66px;
}

.pref-icon.active,
.pref-mid.active {
  background: #7fa287;
  color: #ffffff;
  border-color: #6e9377;
  box-shadow: 0 0 0 2px rgba(241, 248, 240, 0.95);
}

.map-container {
  flex: 1;
  position: relative;
  margin: 16px 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  background: #eef3eb;
  order: 1;
}

.map-view {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.map-loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #475569;
  z-index: 5;
}

.legend-box {
  position: absolute;
  left: 24px;
  bottom: 24px;
  background: white;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: #475569;
  z-index: 1000;
  border: 1px solid #e2e8f0;
  pointer-events: auto;
}

.legend-box h4 {
  margin: 0 0 10px 0;
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.legend-facility {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.toilet-icon {
  background: transparent;
  color: #1f2937;
  font-size: 16px;
}

.bench-icon {
  background: #d99a2b;
  border-radius: 50%;
}

.legend-pin {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.start-pin,
.end-pin {
  background: #dc2626;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-left: 5px;
  margin-right: 17px;
  flex-shrink: 0;
}

.user-dot {
  background: #22c55e;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cbd5e1;
}

.legend-color {
  display: inline-block;
  width: 18px;
  height: 5px;
  border-radius: 2px;
  margin-left: 3px;
  margin-right: 15px;
  flex-shrink: 0;
}

.route-color {
  background: #16a34a;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-item span:last-child {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.route-alerts {
  margin-top: 12px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card.warning {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.alert-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #92400e;
  margin-bottom: 4px;
}

.alert-desc {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #b45309;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .my-routes-page {
    flex-direction: column;
    min-height: auto;
  }
  .sidebar {
    width: 100%;
    border-left: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 24px;
  }
  .map-container {
    height: 65vh;
    margin: 16px;
  }
}
</style>
