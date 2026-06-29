import { computed, ref } from 'vue'
import { getApiBase } from '../../../config/api'
import { DEFAULT_SEARCH_RADIUS_METERS } from '../constants'

function formatDistanceMeters(meters) {
  const m = Number(meters)
  if (!Number.isFinite(m) || m < 0) return ''
  if (m < 1000) return `${Math.round(m)}m`
  const km = m / 1000
  const rounded = Math.round(km * 10) / 10
  return `${rounded}km`
}

function buildCounselingCentersFetchUrl(lat, lng, radiusMeters) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusMeters),
  })
  if (import.meta.env.DEV) {
    return `/__counseling/counseling-centers?${params}`
  }
  const base = getApiBase(import.meta.env.VITE_COUNSELING_API_BASE)
  return `${base}/counseling-centers?${params}`
}

async function fetchCounselingCentersRows(lat, lng, radiusMeters) {
  const response = await fetch(buildCounselingCentersFetchUrl(lat, lng, radiusMeters))
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const payload = await response.json()
  if (payload?.status !== 'success' || !Array.isArray(payload?.data)) {
    throw new Error('Unexpected API response')
  }
  return payload.data
}

export function useSupportFacilities() {
  const loadingRooms = ref(false)
  const roomsFetchError = ref('')
  const rooms = ref([])

  async function fetchRoomsNearby(userOrigin) {
    loadingRooms.value = true
    roomsFetchError.value = ''
    try {
      const envRadius = Number(import.meta.env.VITE_COUNSELING_SEARCH_RADIUS_METERS)
      const primaryRadius =
        Number.isFinite(envRadius) && envRadius > 0 ? envRadius : DEFAULT_SEARCH_RADIUS_METERS

      const rows = await fetchCounselingCentersRows(userOrigin.lat, userOrigin.lng, primaryRadius)

      rooms.value = rows.map((item) => {
        const position = { lat: Number(item.latitude), lng: Number(item.longitude) }
        const meters = Number(item.distance_meters)
        return {
          id: item.id,
          name: item.name,
          address: item.address,
          openHours: item.open_hours || null,
          phone: item.phone || '',
          position,
          rating: item.rating,
          website: item.website || '',
          distanceMeters: meters,
          distanceText: formatDistanceMeters(meters),
          durationText: '',
        }
      })
    } catch (err) {
      console.error('counseling-centers', err)
      rooms.value = []
      roomsFetchError.value =
        'Unable to load nearby counseling centers. Please try again later, or check your network and API configuration (CORS must allow your site in production).'
    } finally {
      loadingRooms.value = false
    }
  }

  const displayedRooms = computed(() => {
    return rooms.value
  })

  return {
    displayedRooms,
    loadingRooms,
    rooms,
    roomsFetchError,
    fetchRoomsNearby,
  }
}
