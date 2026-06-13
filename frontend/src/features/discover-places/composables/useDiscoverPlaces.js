import { computed, ref, watch } from 'vue'
import { buildApiUrl, getApiBase } from '../../../config/api'

export const STORAGE_KEY_CATEGORIES = 'discoverPlaces.selectedCategories'
export const STORAGE_KEY_RADIUS = 'discoverPlaces.selectedRadius'
export const STORAGE_KEY_CROWD_DENSITY = 'discoverPlaces.crowdDensityEnabled'
export const PLACES_PER_PAGE = 20
export const MAX_MAP_MARKERS = 300

export const CATEGORY_OPTIONS = [
  { key: 'landmarks', label: 'Landmarks', tagLabel: 'Landmark', icon: '🏛️' },
  {
    key: 'cafes_restaurants',
    label: 'Cafes & restaurants',
    tagLabel: 'Cafe/Restaurant',
    icon: '☕',
  },
  { key: 'artworks_fountains', label: 'Artworks & fountains', tagLabel: 'Artwork', icon: '🎨' },
  {
    key: 'memorials_sculptures',
    label: 'Memorials & sculptures',
    tagLabel: 'Memorial',
    icon: '🗿',
  },
]

export const RADIUS_OPTIONS = [
  { meters: 500, label: '500 m' },
  { meters: 1000, label: '1 km' },
  { meters: 2000, label: '2 km' },
  { meters: 3000, label: 'Exceed 2 km' },
]

export const DEFAULT_CATEGORY_KEYS = CATEGORY_OPTIONS.map((option) => option.key)
export const DEFAULT_RADIUS = 1000
export const DISCOVER_DEFAULT_LIMIT = 200
export const RESTAURANT_MAP_RANDOM_PICK_LIMIT = 60
export const VENUES_DEFAULT_LIMIT = 5000
export const VENUES_EXTENDED_LIMIT = 15000
export const EXCEED_2KM_QUERY_RADIUS = 20000
export const EXCEED_2KM_QUERY_LIMIT = 1000

export const MELBOURNE_METRO_BOUNDS = {
  minLat: -38.55,
  maxLat: -37.2,
  minLng: 144.2,
  maxLng: 145.9,
}

export const mapMarkerColorByCategory = {
  landmarks: '#f97316',
  cafes_restaurants: '#ec4899',
  artworks_fountains: '#22c55e',
  memorials_sculptures: '#3b82f6',
}

export const IDEAS_CATEGORY_CHOICES = [
  {
    key: 'history_story',
    label: 'I want history stories and iconic city sights',
    categoryKey: 'landmarks',
  },
  {
    key: 'creative_relax',
    label: 'I want creative vibes, artworks, and waterside views',
    categoryKey: 'artworks_fountains',
  },
  {
    key: 'quiet_reflect',
    label: 'I want a quiet, reflective walk with memorial spaces',
    categoryKey: 'memorials_sculptures',
  },
  {
    key: 'cosy_dining',
    label: 'I want a cosy cafe or local dining spot to enjoy',
    categoryKey: 'cafes_restaurants',
  },
]

export const categoryMetaByKey = CATEGORY_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option
  return acc
}, {})

export function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value
  }
  return null
}

export function toFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function normalizeApiPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload

  // Support API Gateway/Lambda proxy responses: { statusCode, body: "..." }.
  if (typeof payload.body === 'string') {
    try {
      return JSON.parse(payload.body)
    } catch {
      return payload
    }
  }
  return payload
}

export function normalizeCategory(rawCategory) {
  const text = String(rawCategory || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
  if (text.includes('cafe') || text.includes('restaurant') || text.includes('dining'))
    return 'cafes_restaurants'
  if (text.includes('landmark')) return 'landmarks'
  if (text.includes('art') || text.includes('fountain')) return 'artworks_fountains'
  if (text.includes('memorial') || text.includes('sculpture') || text.includes('monument'))
    return 'memorials_sculptures'
  return 'landmarks'
}

export function normalizePlace(input, index, sourceType = 'places') {
  const categoryRaw = pickFirstDefined(
    input.category,
    input.type,
    input.place_category,
    input.category_name,
    input.categoryName,
  )
  const categoryKey =
    normalizeCategory(categoryRaw) || (sourceType === 'venues' ? 'cafes_restaurants' : 'landmarks')
  if (!categoryKey) return null

  const latCandidate = toFiniteNumber(
    pickFirstDefined(input.latitude, input.lat, input.location?.lat, input.location_lat, input.y),
  )
  const lngCandidate = toFiniteNumber(
    pickFirstDefined(input.longitude, input.lng, input.location?.lng, input.location_lng, input.x),
  )
  const distanceMetersCandidate = toFiniteNumber(
    pickFirstDefined(
      input.distance_meters,
      input.distanceMeters,
      input.distance_meter,
      input.approx_distance_m,
      input.distance,
    ),
  )
  const hasCoords = latCandidate !== null && lngCandidate !== null
  const name = String(
    pickFirstDefined(input.name, input.place_name, input.placeName, 'Unnamed place'),
  )
  const address = String(
    pickFirstDefined(
      input.address,
      input.formatted_address,
      input.location_address,
      input.locationAddress,
      `${name}, Melbourne VIC`,
    ) || '',
  )
  const isRichDetailCategory = categoryKey !== 'landmarks'
  const artistOrSubjectRaw = pickFirstDefined(
    input.artist,
    input.artist_name,
    input.subject,
    input.artist_or_subject,
  )
  const yearRaw = pickFirstDefined(input.year, input.year_created, input.period)
  const materialRaw = pickFirstDefined(input.material, input.materials, input.medium)
  const descriptionRaw = pickFirstDefined(input.description, input.summary, input.details)
  const workTitleRaw = pickFirstDefined(input.work_title, input.workTitle, input.title, name)
  const resolvedDescription = (() => {
    if (descriptionRaw !== undefined && descriptionRaw !== null && String(descriptionRaw).trim()) {
      return String(descriptionRaw)
    }
    if (isRichDetailCategory) {
      return `${name} is a notable Melbourne public work that contributes to the city's cultural streetscape.`
    }
    return ''
  })()

  return {
    id: `${sourceType}-${String(
      pickFirstDefined(input.id, input.place_id, input.placeId, input.uuid, `place-${index}`),
    )}`,
    sourceId: String(
      pickFirstDefined(input.id, input.place_id, input.placeId, input.uuid, `place-${index}`),
    ),
    sourceType,
    name,
    categoryKey,
    categoryLabel: categoryMetaByKey[categoryKey].label,
    lat: hasCoords ? latCandidate : null,
    lng: hasCoords ? lngCandidate : null,
    address,
    distanceMetersFromApi: distanceMetersCandidate,
    imageUrl: String(
      pickFirstDefined(input.image_url, input.imageUrl, input.image, input.thumbnail_url, '') || '',
    ),
    icon: String(input.icon ?? '').trim() || categoryMetaByKey[categoryKey].icon,
    infoUrl: String(
      pickFirstDefined(
        input.more_info_url,
        input.moreInfoUrl,
        input.more_info_link,
        input.detail_url,
        input.website,
        input.url,
        '',
      ) || '',
    ),
    artistOrSubject: isRichDetailCategory
      ? String(artistOrSubjectRaw || 'City of Melbourne collection')
      : '',
    year: isRichDetailCategory ? String(yearRaw || 'Unknown') : '',
    workTitle: isRichDetailCategory ? String(workTitleRaw || name) : '',
    material: isRichDetailCategory ? String(materialRaw || 'Mixed materials') : '',
    description: resolvedDescription,
  }
}

export function toRadians(value) {
  return (value * Math.PI) / 180
}

export function toDegrees(value) {
  return (value * 180) / Math.PI
}

export function calculateDistanceMeters(from, to) {
  const earthRadiusMeters = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMeters * c
}

export function formatDistance(distanceMeters) {
  if (distanceMeters < 1000) return `Approx. ${Math.round(distanceMeters)} m`
  return `Approx. ${(distanceMeters / 1000).toFixed(1)} km`
}

export function parsePlacesPayload(payload) {
  const normalized = normalizeApiPayload(payload)
  if (Array.isArray(normalized)) return normalized
  if (Array.isArray(normalized?.data)) return normalized.data
  if (Array.isArray(normalized?.places)) return normalized.places
  if (Array.isArray(normalized?.venues)) return normalized.venues
  if (Array.isArray(normalized?.items)) return normalized.items
  if (Array.isArray(normalized?.results)) return normalized.results
  if (Array.isArray(normalized?.records)) return normalized.records
  if (normalized && typeof normalized === 'object') return [normalized]
  return []
}

export function buildDiscoverApiUrl(path) {
  if (import.meta.env.DEV) {
    const normalizedPath = path.replace(/^\//, '')
    return new URL(normalizedPath, `${window.location.origin}/__discover/`)
  }
  return buildApiUrl(path, getApiBase(import.meta.env.VITE_DISCOVER_PLACES_API_BASE_URL))
}

function normalizeTextKeyPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeNameForDedup(name) {
  return normalizeTextKeyPart(name)
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
      return word
    })
    .join(' ')
}

function normalizeRestaurantNameForDedup(name) {
  let normalized = normalizeTextKeyPart(name)
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Collapse common truncated/typo variants, e.g. "Alf'S Caf?" vs "Alf'S Cafe".
  if (/\bcaf$/.test(normalized)) normalized = `${normalized}e`

  return normalized
}

function buildPlaceDedupKey(place) {
  const sourceType = normalizeTextKeyPart(place?.sourceType)
  const sourceId = normalizeTextKeyPart(place?.sourceId)
  if (sourceType && sourceId) return `src:${sourceType}:${sourceId}`

  const name = normalizeTextKeyPart(place?.name)
  const address = normalizeTextKeyPart(place?.address)
  const latPart = Number.isFinite(place?.lat) ? Number(place.lat).toFixed(5) : 'no-lat'
  const lngPart = Number.isFinite(place?.lng) ? Number(place.lng).toFixed(5) : 'no-lng'
  return `fallback:${name}|${address}|${latPart}|${lngPart}`
}

function pickCloserPlace(a, b) {
  const distA =
    typeof a?.distanceMeters === 'number'
      ? a.distanceMeters
      : (toFiniteNumber(a?.distanceMetersFromApi) ?? Number.POSITIVE_INFINITY)
  const distB =
    typeof b?.distanceMeters === 'number'
      ? b.distanceMeters
      : (toFiniteNumber(b?.distanceMetersFromApi) ?? Number.POSITIVE_INFINITY)
  return distB < distA ? b : a
}

function dedupeRestaurantsByName(places) {
  const bestByName = new Map()
  places.forEach((place) => {
    const key = normalizeRestaurantNameForDedup(place?.name)
    if (!key) return
    const existing = bestByName.get(key)
    bestByName.set(key, existing ? pickCloserPlace(existing, place) : place)
  })
  return [...bestByName.values()]
}

function dedupePlaces(places) {
  const restaurants = []
  const others = []
  places.forEach((place) => {
    if (place?.categoryKey === 'cafes_restaurants') restaurants.push(place)
    else others.push(place)
  })

  const seenKeys = new Set()
  const dedupedOthers = []
  others.forEach((place) => {
    const key = buildPlaceDedupKey(place)
    if (seenKeys.has(key)) return
    seenKeys.add(key)
    dedupedOthers.push(place)
  })

  return [...dedupedOthers, ...dedupeRestaurantsByName(restaurants)]
}

function buildDisplayDedupKey(place) {
  const latPart = Number.isFinite(place?.lat) ? Number(place.lat).toFixed(4) : ''
  const lngPart = Number.isFinite(place?.lng) ? Number(place.lng).toFixed(4) : ''
  const namePart = normalizeNameForDedup(place?.name)
  const addressPart = normalizeTextKeyPart(place?.address)

  if (latPart && lngPart) {
    return `geo:${latPart}|${lngPart}|${namePart || addressPart}`
  }
  return `txt:${namePart}|${addressPart}`
}

function dedupePlacesForDisplay(places) {
  const seen = new Set()
  const output = []
  places.forEach((place) => {
    const dedupKey =
      place.categoryKey === 'cafes_restaurants'
        ? `restaurant:${normalizeRestaurantNameForDedup(place?.name)}`
        : buildDisplayDedupKey(place)
    if (seen.has(dedupKey)) return
    seen.add(dedupKey)
    output.push(place)
  })
  return output
}

export function useDiscoverPlaces({ isCrowdDensityEnabled, onPlacesLoaded } = {}) {
  const allPlaces = ref([])
  const isLoadingPlaces = ref(true)
  const loadError = ref('')
  const locationUnavailable = ref(false)
  const selectedCategories = ref([...DEFAULT_CATEGORY_KEYS])
  const selectedRadius = ref(DEFAULT_RADIUS)
  const currentPage = ref(1)
  const userLocation = ref(null)
  const venuesCacheByQuery = new Map()
  let placesRequestSeq = 0

  function isPlaceWithinSelectedRadiusBand(distanceMeters) {
    if (typeof distanceMeters !== 'number') return false
    if (selectedRadius.value === 500) return distanceMeters <= 500
    if (selectedRadius.value === 1000) return distanceMeters > 500 && distanceMeters <= 1000
    if (selectedRadius.value === 2000) return distanceMeters > 1000 && distanceMeters <= 2000
    if (selectedRadius.value === 3000) return distanceMeters > 2000
    return false
  }

  function buildQueryOptions() {
    const queryLimit =
      selectedRadius.value === 3000 ? EXCEED_2KM_QUERY_LIMIT : DISCOVER_DEFAULT_LIMIT
    const queryRadius =
      selectedRadius.value === 3000 ? EXCEED_2KM_QUERY_RADIUS : selectedRadius.value
    return { queryLimit, queryRadius }
  }

  function buildPlacesApiUrl() {
    const endpoint = buildDiscoverApiUrl('/places')
    const { queryLimit, queryRadius } = buildQueryOptions()
    endpoint.searchParams.set('limit', String(queryLimit))
    endpoint.searchParams.set('radius', String(queryRadius))
    if (userLocation.value) {
      endpoint.searchParams.set('lat', String(userLocation.value.lat))
      endpoint.searchParams.set('lng', String(userLocation.value.lng))
    }
    return endpoint.toString()
  }

  function buildVenuesApiUrl() {
    const endpoint = buildDiscoverApiUrl('/venues')
    const { queryRadius } = buildQueryOptions()
    // Venues around CBD are dense; wider radius bands need a higher limit to avoid top-N truncation.
    const venuesLimit =
      selectedRadius.value === 2000 || selectedRadius.value === 3000
        ? VENUES_EXTENDED_LIMIT
        : VENUES_DEFAULT_LIMIT
    endpoint.searchParams.set('limit', String(venuesLimit))
    endpoint.searchParams.set('radius', String(queryRadius))
    if (userLocation.value) {
      endpoint.searchParams.set('lat', String(userLocation.value.lat))
      endpoint.searchParams.set('lng', String(userLocation.value.lng))
    }
    return endpoint.toString()
  }

  function buildVenuesCacheKey(queryRadius) {
    const lat = userLocation.value?.lat
    const lng = userLocation.value?.lng
    const latPart = Number.isFinite(lat) ? lat.toFixed(5) : 'default-lat'
    const lngPart = Number.isFinite(lng) ? lng.toFixed(5) : 'default-lng'
    return `${latPart}|${lngPart}|${queryRadius}`
  }

  function readSessionState() {
    try {
      const storedCategoriesRaw = sessionStorage.getItem(STORAGE_KEY_CATEGORIES)
      if (storedCategoriesRaw !== null) {
        const storedCategories = JSON.parse(storedCategoriesRaw)
        if (Array.isArray(storedCategories)) {
          const valid = storedCategories.filter((key) => DEFAULT_CATEGORY_KEYS.includes(key))
          if (valid.length > 0 || storedCategories.length === 0) selectedCategories.value = valid
        }
      }
      const storedRadius = Number(sessionStorage.getItem(STORAGE_KEY_RADIUS))
      if (RADIUS_OPTIONS.some((option) => option.meters === storedRadius)) {
        selectedRadius.value = storedRadius
      }
      const storedCrowdDensity = sessionStorage.getItem(STORAGE_KEY_CROWD_DENSITY)
      if (storedCrowdDensity === 'true' && isCrowdDensityEnabled) {
        isCrowdDensityEnabled.value = true
      }
      if (storedCrowdDensity === 'false' && isCrowdDensityEnabled) {
        isCrowdDensityEnabled.value = false
      }
    } catch {
      selectedCategories.value = [...DEFAULT_CATEGORY_KEYS]
      selectedRadius.value = DEFAULT_RADIUS
      if (isCrowdDensityEnabled) isCrowdDensityEnabled.value = true
    }
  }

  function persistSessionState() {
    sessionStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(selectedCategories.value))
    sessionStorage.setItem(STORAGE_KEY_RADIUS, String(selectedRadius.value))
    if (isCrowdDensityEnabled) {
      sessionStorage.setItem(STORAGE_KEY_CROWD_DENSITY, String(isCrowdDensityEnabled.value))
    }
  }

  watch([selectedCategories, selectedRadius], () => persistSessionState(), { deep: true })
  if (isCrowdDensityEnabled) {
    watch(isCrowdDensityEnabled, () => {
      persistSessionState()
    })
  }

  const placesWithDistance = computed(() => {
    if (!userLocation.value) {
      return allPlaces.value.map((place) => ({
        ...place,
        distanceMeters: toFiniteNumber(place.distanceMetersFromApi),
      }))
    }
    return allPlaces.value.map((place) => {
      const distanceFromApi = toFiniteNumber(place.distanceMetersFromApi)
      if (distanceFromApi !== null) {
        return { ...place, distanceMeters: distanceFromApi }
      }
      if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
        const distanceMeters = calculateDistanceMeters(userLocation.value, {
          lat: place.lat,
          lng: place.lng,
        })
        return { ...place, distanceMeters }
      }
      return { ...place, distanceMeters: null }
    })
  })

  const selectedCategorySet = computed(() => new Set(selectedCategories.value))

  const filteredPlaces = computed(() => {
    if (selectedCategories.value.length === 0) return []

    const byCategory = placesWithDistance.value.filter((place) =>
      selectedCategorySet.value.has(place.categoryKey),
    )

    const withDistance = byCategory.filter((place) => typeof place.distanceMeters === 'number')
    const withoutDistance = byCategory.filter((place) => typeof place.distanceMeters !== 'number')

    const radiusMatched = withDistance.filter((place) =>
      isPlaceWithinSelectedRadiusBand(place.distanceMeters),
    )
    if (radiusMatched.length > 0) {
      return dedupePlacesForDisplay(
        radiusMatched.sort((a, b) => a.distanceMeters - b.distanceMeters),
      )
    }

    // If distance is unavailable for all places, keep a stable name-sorted fallback list.
    if (!withDistance.length) {
      return dedupePlacesForDisplay(withoutDistance.sort((a, b) => a.name.localeCompare(b.name)))
    }

    return []
  })

  const placesWithinRadius = computed(() => {
    const byRadius = placesWithDistance.value.filter(
      (place) =>
        typeof place.distanceMeters === 'number' &&
        isPlaceWithinSelectedRadiusBand(place.distanceMeters),
    )
    if (byRadius.length > 0) return byRadius
    if (!placesWithDistance.value.some((place) => typeof place.distanceMeters === 'number')) {
      return placesWithDistance.value
    }
    return []
  })

  const categoryCounts = computed(() => {
    const counts = {}
    CATEGORY_OPTIONS.forEach((option) => {
      counts[option.key] = 0
    })
    placesWithinRadius.value.forEach((place) => {
      counts[place.categoryKey] = (counts[place.categoryKey] || 0) + 1
    })
    return counts
  })

  const totalPlaces = computed(() => filteredPlaces.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalPlaces.value / PLACES_PER_PAGE)))

  const pagedPlaces = computed(() => {
    const start = (currentPage.value - 1) * PLACES_PER_PAGE
    return filteredPlaces.value.slice(start, start + PLACES_PER_PAGE)
  })

  const showSelectCategoryHint = computed(() => selectedCategories.value.length === 0)
  const showNoMatchHint = computed(
    () =>
      selectedCategories.value.length > 0 &&
      !isLoadingPlaces.value &&
      totalPlaces.value === 0 &&
      !loadError.value &&
      !!userLocation.value,
  )

  const canExpandToExceed2Km = computed(
    () => showNoMatchHint.value && selectedRadius.value < 3000,
  )

  function toggleCategory(categoryKey) {
    if (selectedCategorySet.value.has(categoryKey)) {
      selectedCategories.value = selectedCategories.value.filter((item) => item !== categoryKey)
    } else {
      selectedCategories.value = [...selectedCategories.value, categoryKey]
    }
    currentPage.value = 1
  }

  function selectRadius(radiusMeters) {
    if (selectedRadius.value === radiusMeters) return
    selectedRadius.value = radiusMeters
    currentPage.value = 1
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
  }

  function expandTo2Km() {
    selectRadius(3000)
  }

  async function loadPlaces() {
    const requestId = ++placesRequestSeq
    isLoadingPlaces.value = true
    loadError.value = ''
    try {
      const shouldLoadVenues = selectedCategories.value.includes('cafes_restaurants')
      const placesResponse = await fetch(buildPlacesApiUrl())
      if (!placesResponse.ok) throw new Error(`Failed to load places (${placesResponse.status})`)
      const placesPayload = parsePlacesPayload(await placesResponse.json())
      if (requestId !== placesRequestSeq) return
      const normalizedPlaces = placesPayload
        .map((item, index) => normalizePlace(item, index, 'places'))
        .filter(Boolean)

      let normalizedVenues = []
      if (shouldLoadVenues) {
        const { queryRadius } = buildQueryOptions()
        const venuesCacheKey = buildVenuesCacheKey(queryRadius)
        const cachedVenues = venuesCacheByQuery.get(venuesCacheKey)
        if (cachedVenues) {
          normalizedVenues = cachedVenues
        } else {
          const venuesResponse = await fetch(buildVenuesApiUrl())
          if (!venuesResponse.ok) throw new Error(`Failed to load venues (${venuesResponse.status})`)
          const venuesPayload = parsePlacesPayload(await venuesResponse.json())
          if (requestId !== placesRequestSeq) return
          normalizedVenues = venuesPayload
            .map((item, index) => normalizePlace(item, index, 'venues'))
            .filter(Boolean)
          venuesCacheByQuery.set(venuesCacheKey, normalizedVenues)
        }
      }

      allPlaces.value = dedupePlaces([...normalizedPlaces, ...normalizedVenues])
      onPlacesLoaded?.()
    } catch (error) {
      if (requestId !== placesRequestSeq) return
      loadError.value = 'Places are temporarily unavailable. Please try again in a little while.'
      allPlaces.value = []
      console.error('[Discover Places] Failed to load places:', error)
    } finally {
      if (requestId === placesRequestSeq) {
        isLoadingPlaces.value = false
      }
    }
  }

  return {
    allPlaces,
    isLoadingPlaces,
    loadError,
    locationUnavailable,
    selectedCategories,
    selectedRadius,
    currentPage,
    userLocation,
    categoryMetaByKey,
    placesWithDistance,
    selectedCategorySet,
    filteredPlaces,
    placesWithinRadius,
    categoryCounts,
    totalPlaces,
    totalPages,
    pagedPlaces,
    showSelectCategoryHint,
    showNoMatchHint,
    canExpandToExceed2Km,
    readSessionState,
    persistSessionState,
    buildQueryOptions,
    toggleCategory,
    selectRadius,
    goToPage,
    expandTo2Km,
    loadPlaces,
  }
}
