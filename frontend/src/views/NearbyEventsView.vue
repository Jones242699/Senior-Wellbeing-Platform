<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getApiBase } from '../config/api'
import { loadOsmMapsApi } from '../utils/osmMaps'

const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 }
const FILTER_CATEGORIES = [
  'community',
  'music',
  'art',
  'wellness',
  'workshop',
  'walking',
  'seniors',
  'gardening',
  'yoga',
  'theatre',
]
const MAX_DISTANCE_KM = 50
const MELBOURNE_METRO_BOUNDS = {
  minLat: -38.55,
  maxLat: -37.2,
  minLng: 144.2,
  maxLng: 145.9,
}
const EVENTS_FETCH_LIMIT = 100
const EVENTS_KEYWORD_SEARCH_LIMIT = 20

const router = useRouter()
const loading = ref(false)
const locatingUser = ref(false)
const resolvingAddress = ref(false)
const errorText = ref('')
const events = ref([])
const keyword = ref('')
/** Narrows the current list when searching within a selected category (no extra API keyword). */
const activeTextFilter = ref('')
const address = ref('')
const selectedCategory = ref('community')
/** When true, category dropdown is bypassed and all keyword types within radius (+ text filter) are shown. */
const showEveryCategory = ref(true)
const queryInputRef = ref(null)
const queryPlace = ref(null)
const searchMeta = ref('Using Melbourne CBD')
const selectedLocation = ref({ ...MELBOURNE_CENTER })
let queryAutocomplete

const categoryOptions = computed(() => FILTER_CATEGORIES)

const nearbyEvents = computed(() =>
  events.value.filter((event) => {
    const distance = Number(event?.distance)
    return Number.isFinite(distance) && distance <= MAX_DISTANCE_KM
  }),
)

function eventMatchesTextFilter(event, term) {
  const t = term.trim().toLowerCase()
  if (!t) return true
  const hay = [event?.name, event?.venue, event?.classification, event?.keyword]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(t)
}

const displayedEvents = computed(() => {
  const text = activeTextFilter.value.trim()
  if (!text) return nearbyEvents.value
  return nearbyEvents.value.filter((event) => eventMatchesTextFilter(event, text))
})

const eventsInRadiusCount = computed(() => nearbyEvents.value.length)

/** Avoid "3 / 9" looking like 9 cards should render when only the category subset is listed. */
const eventsCountLabel = computed(() => {
  const shown = displayedEvents.value.length
  const inRadius = eventsInRadiusCount.value
  const textFilter = activeTextFilter.value.trim()
  const apiSearch = keyword.value.trim()
  if (textFilter && !showEveryCategory.value) {
    return `${shown} match${shown === 1 ? '' : 'es'} for "${textFilter}" in ${selectedCategory.value} within 50 km`
  }
  if (apiSearch && showEveryCategory.value) {
    return `${shown} result${shown === 1 ? '' : 's'} for "${apiSearch}" within 50 km`
  }
  if (showEveryCategory.value) {
    return `${shown} event${shown === 1 ? '' : 's'} within 50 km`
  }
  if (shown === inRadius) {
    return `${shown} event${shown === 1 ? '' : 's'} (${selectedCategory.value})`
  }
  return `${shown} shown (${selectedCategory.value}) · ${inRadius} within 50 km`
})

const hasEvents = computed(() => displayedEvents.value.length > 0)

function formatDistance(distance) {
  const numeric = Number(distance)
  if (!Number.isFinite(numeric)) return '--'
  if (numeric < 1) return `${Math.round(numeric * 1000)} m`
  return `${numeric.toFixed(2)} km`
}

function isWithinMelbourneMetro(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  return (
    lat >= MELBOURNE_METRO_BOUNDS.minLat &&
    lat <= MELBOURNE_METRO_BOUNDS.maxLat &&
    lng >= MELBOURNE_METRO_BOUNDS.minLng &&
    lng <= MELBOURNE_METRO_BOUNDS.maxLng
  )
}

function assertWithinMelbourne(lat, lng, label = 'Address') {
  if (!isWithinMelbourneMetro(lat, lng)) {
    throw new Error(
      `${label} is outside Melbourne. Please enter an address within metropolitan Melbourne.`,
    )
  }
}

function openEventDetail(event) {
  const query = {}
  if (event?.distance !== undefined && event?.distance !== null) {
    query.distance = String(event.distance)
  }
  if (
    Number.isFinite(selectedLocation.value?.lat) &&
    Number.isFinite(selectedLocation.value?.lng)
  ) {
    query.originLat = String(selectedLocation.value.lat)
    query.originLng = String(selectedLocation.value.lng)
  }
  router.push({ name: 'event-detail', params: { id: event.id }, query })
}

async function geocodeAddress(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(`Address lookup failed (${response.status})`)
  const payload = await response.json()
  const item = Array.isArray(payload) ? payload[0] : null
  if (!item) throw new Error('Address not found. Please try a more specific address.')
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: item.display_name || query,
  }
}

function loadGoogleMapsApi() {
  return loadOsmMapsApi()
}

function setupQueryAutocomplete() {
  const input = queryInputRef.value
  if (!input || !window.google?.maps?.places) return

  queryAutocomplete = new window.google.maps.places.Autocomplete(input, {
    fields: ['geometry', 'formatted_address', 'name'],
    componentRestrictions: { country: 'au' },
  })

  queryAutocomplete.addListener('place_changed', () => {
    const place = queryAutocomplete.getPlace()
    if (!place?.geometry?.location) return
    queryPlace.value = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      label: place.formatted_address || place.name || address.value.trim(),
    }
    address.value = queryPlace.value.label
    errorText.value = ''
  })
}

function onAddressInput() {
  // Manual edits invalidate the last selected suggestion coordinates.
  queryPlace.value = null
}

async function fetchNearbyEvents({ lat, lng, sourceLabel }) {
  loading.value = true
  errorText.value = ''
  try {
    const base = getApiBase(import.meta.env.VITE_EVENTS_API_BASE)
    const url = new URL(`${base}/events`)
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lng', String(lng))
    const textQuery = keyword.value.trim()
    const categoryActive =
      !showEveryCategory.value && FILTER_CATEGORIES.includes(selectedCategory.value)
    const useApiTextSearch = textQuery && showEveryCategory.value

    if (useApiTextSearch) {
      url.searchParams.set('keyword', textQuery)
      url.searchParams.set('limit', String(EVENTS_KEYWORD_SEARCH_LIMIT))
    } else {
      url.searchParams.set('limit', String(EVENTS_FETCH_LIMIT))
      if (categoryActive) {
        url.searchParams.set('keyword', selectedCategory.value)
      }
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json()
    events.value = Array.isArray(payload?.events) ? payload.events : []
    if (!FILTER_CATEGORIES.includes(selectedCategory.value)) {
      selectedCategory.value = 'community'
    }
    selectedLocation.value = { lat, lng }
    searchMeta.value = sourceLabel
  } catch (error) {
    console.error('events-fetch', error)
    events.value = []
    errorText.value = 'Failed to load nearby events. Please check your network and try again.'
  } finally {
    loading.value = false
  }
}

function searchByCurrentLocation() {
  address.value = ''
  queryPlace.value = null
  keyword.value = ''
  activeTextFilter.value = ''
  if (!navigator.geolocation) {
    fetchNearbyEvents({
      lat: MELBOURNE_CENTER.lat,
      lng: MELBOURNE_CENTER.lng,
      sourceLabel: 'Using Melbourne CBD (geolocation unavailable)',
    })
    return
  }

  locatingUser.value = true
  errorText.value = ''
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      locatingUser.value = false
      fetchNearbyEvents({
        lat: coords.latitude,
        lng: coords.longitude,
        sourceLabel: 'Using your real-time location',
      })
    },
    () => {
      locatingUser.value = false
      fetchNearbyEvents({
        lat: MELBOURNE_CENTER.lat,
        lng: MELBOURNE_CENTER.lng,
        sourceLabel: 'Using Melbourne CBD (location permission denied)',
      })
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

async function searchByAddress() {
  keyword.value = ''
  activeTextFilter.value = ''
  const query = address.value.trim()
  if (!query) {
    errorText.value = 'Please input an address first.'
    return
  }

  resolvingAddress.value = true
  errorText.value = ''
  try {
    const resolved = queryPlace.value || (await geocodeAddress(query))
    assertWithinMelbourne(resolved.lat, resolved.lng, 'Start location')
    await fetchNearbyEvents({
      lat: resolved.lat,
      lng: resolved.lng,
      sourceLabel: `Address: ${resolved.label}`,
    })
  } catch (error) {
    console.error('address-geocode', error)
    errorText.value =
      error?.message || 'Unable to resolve this address. Please adjust the input and retry.'
  } finally {
    resolvingAddress.value = false
  }
}

function refetchEventsForCurrentLocation() {
  return fetchNearbyEvents({
    lat: selectedLocation.value.lat,
    lng: selectedLocation.value.lng,
    sourceLabel: searchMeta.value,
  })
}

function eventsMatchCurrentCategory() {
  if (showEveryCategory.value) return true
  const category = selectedCategory.value
  if (!FILTER_CATEGORIES.includes(category)) return false
  if (events.value.length === 0) return false
  return events.value.every((event) => (event?.keyword || '').trim().toLowerCase() === category)
}

async function searchByKeyword() {
  const term = keyword.value.trim()
  if (!term) {
    errorText.value = 'Please enter a keyword to search.'
    return
  }
  errorText.value = ''

  if (!showEveryCategory.value) {
    activeTextFilter.value = term
    if (!eventsMatchCurrentCategory()) {
      await refetchEventsForCurrentLocation()
    }
    return
  }

  activeTextFilter.value = ''
  events.value = []
  await refetchEventsForCurrentLocation()
}

function showAllCategories() {
  showEveryCategory.value = true
  keyword.value = ''
  activeTextFilter.value = ''
  refetchEventsForCurrentLocation()
}

function onFilterSelectChange(event) {
  const value = event.target.value
  keyword.value = ''
  activeTextFilter.value = ''
  if (value === '__all_categories__') {
    showEveryCategory.value = true
    refetchEventsForCurrentLocation()
    return
  }
  showEveryCategory.value = false
  selectedCategory.value = value
  refetchEventsForCurrentLocation()
}

onMounted(async () => {
  try {
    await loadGoogleMapsApi()
    await nextTick()
    setupQueryAutocomplete()
  } catch (error) {
    console.warn('events-google-places', error)
  }
  searchByCurrentLocation()
})
</script>

<template>
  <main class="events-page">
    <section class="top-bar">
      <router-link to="/" class="back-link" title="Back to Home">
        <span class="back-icon">←</span>
      </router-link>

      <div class="search-box">
        <div class="row">
          <input
            ref="queryInputRef"
            v-model="address"
            type="text"
            class="input"
            placeholder="Input address to find nearby events"
            @input="onAddressInput"
          />
          <button
            class="btn btn-primary"
            type="button"
            :disabled="resolvingAddress"
            @click="searchByAddress"
          >
            {{ resolvingAddress ? 'Resolving...' : 'Search Address' }}
          </button>
          <button
            class="btn btn-success"
            type="button"
            :disabled="locatingUser || loading"
            @click="searchByCurrentLocation"
          >
            {{
              locatingUser
                ? 'Getting location...'
                : loading
                  ? 'Loading events...'
                  : 'Use My Location'
            }}
          </button>
        </div>
        <div class="row row--secondary">
          <input
            v-model="keyword"
            type="text"
            class="input"
            placeholder="Search events"
            @keydown.enter.prevent="searchByKeyword"
          />
          <button
            class="btn btn-primary"
            type="button"
            :disabled="loading"
            @click="searchByKeyword"
          >
            Search
          </button>
          <select
            class="filter-select"
            aria-label="Filter by category"
            :value="showEveryCategory ? '__all_categories__' : selectedCategory"
            @change="onFilterSelectChange"
          >
            <option value="__all_categories__">All categories</option>
            <option v-for="category in categoryOptions" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
          <button class="btn btn-neutral" type="button" @click="showAllCategories">Show All</button>
        </div>
        <p class="meta">{{ searchMeta }}</p>
        <p v-if="errorText" class="error">{{ errorText }}</p>
      </div>
    </section>

    <section class="content">
      <div class="header-line">
        <h1>Nearby Elderly-friendly Events</h1>
        <p class="count">{{ eventsCountLabel }}</p>
      </div>

      <div v-if="loading" class="state">Loading events...</div>
      <div v-else-if="!hasEvents" class="state">
        <template v-if="activeTextFilter.trim() || (keyword.trim() && showEveryCategory)">
          No events found for "{{ activeTextFilter.trim() || keyword.trim() }}" within 50 km. Try
          another keyword, or click Show All to browse all categories.
        </template>
        <template v-else>No events found near this location.</template>
      </div>

      <div v-else class="cards">
        <article v-for="event in displayedEvents" :key="event.id" class="card">
          <img :src="event.image" :alt="event.name" class="cover" />
          <div class="body">
            <p class="tag">
              {{ event.classification || 'Event' }} · {{ event.keyword || 'general' }}
            </p>
            <h2>{{ event.name }}</h2>
            <p class="line"><strong>Date:</strong> {{ event.date || '--' }}</p>
            <p class="line"><strong>Venue:</strong> {{ event.venue || '--' }}</p>
            <p class="line"><strong>Distance:</strong> {{ formatDistance(event.distance) }}</p>
            <button class="details-btn" type="button" @click="openEventDetail(event)">
              View Details
            </button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.events-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px 28px;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.top-bar {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  color: #1f2937;
  text-decoration: none;
  background: #ffffff;
}

.back-icon {
  font-size: 24px;
  font-weight: 700;
}

.search-box {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row--secondary {
  margin-top: 8px;
}

.input {
  flex: 1;
  height: 42px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
}

.btn {
  border: none;
  border-radius: 10px;
  color: #ffffff;
  padding: 0 14px;
  height: 42px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.btn-primary {
  background: #0f766e;
}

.btn-success {
  background: #16a34a;
}

.btn-neutral {
  color: #14532d;
  background: #e2e8f0;
}

.filter-select {
  height: 42px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: #ffffff;
  color: #1f2937;
  padding: 0 12px;
  padding-right: 36px;
  min-width: 170px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  /* Chevron inset from right edge (looks cleaner than native flush-right arrow) */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px;
}

.meta {
  margin: 8px 0 0;
  color: #475569;
  font-size: 13px;
}

.error {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 13px;
}

.content {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
}

.header-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.count {
  margin: 0;
  color: #64748b;
}

.state {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 12px;
  color: #475569;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: #e2e8f0;
}

.body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tag {
  margin: 0 0 8px;
  font-size: 12px;
  color: #475569;
  text-transform: capitalize;
}

h2 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #1f2937;
  line-height: 1.35;
}

.line {
  margin: 0 0 6px;
  color: #334155;
  font-size: 14px;
}

.details-btn {
  margin-top: auto;
  width: 100%;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #16a34a;
  color: #166534;
  font-weight: 700;
  cursor: pointer;
  background: #f0fdf4;
}

@media (max-width: 900px) {
  .top-bar {
    flex-wrap: wrap;
  }

  .search-box {
    width: 100%;
  }

  .row {
    flex-wrap: wrap;
  }

  .btn {
    flex: 1;
  }
}
</style>
