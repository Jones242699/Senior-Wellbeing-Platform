import { computed, ref } from 'vue'
import { getApiBase } from '../../../config/api'
import {
  CBD_ANCHOR_FALLBACK_RADIUS_METERS,
  DEFAULT_SEARCH_RADIUS_METERS,
  DISTANCE_BATCH_MAX_DESTINATIONS,
  MELBOURNE_CENTER,
  NEARBY_DISTANCE_METERS,
} from '../constants'

export function formatWalkDuration(durationText) {
  if (!durationText) return '--'
  return /walk/i.test(durationText) ? durationText : `${durationText} walk`
}

function parseDistanceToMeters(distanceText) {
  if (!distanceText) return Number.POSITIVE_INFINITY
  const text = distanceText.toLowerCase().replace(/,/g, '').trim()
  if (text.endsWith('km')) return Number.parseFloat(text) * 1000
  if (text.endsWith('m')) return Number.parseFloat(text)
  return Number.POSITIVE_INFINITY
}

/** Backend `distance_meters` is used for list sort/display until batched route distances update. */
function formatDistanceMeters(meters) {
  const m = Number(meters)
  if (!Number.isFinite(m) || m < 0) return ''
  if (m < 1000) return `${Math.round(m)}m`
  const km = m / 1000
  const rounded = Math.round(km * 10) / 10
  return `${rounded}km`
}

/** Straight-line distance between two WGS84 points (meters). */
export function haversineMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
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

export function useSupportFacilities({ filterCenter, selectedRoomId }) {
  const loadingRooms = ref(false)
  const roomsFetchError = ref('')
  const rooms = ref([])

  function sortRoomsByWalkingDistance() {
    rooms.value = [...rooms.value].sort(
      (a, b) => parseDistanceToMeters(a.distanceText) - parseDistanceToMeters(b.distanceText),
    )
  }

  async function fetchRoomsNearby(userOrigin) {
    loadingRooms.value = true
    roomsFetchError.value = ''
    try {
      const envRadius = Number(import.meta.env.VITE_COUNSELING_SEARCH_RADIUS_METERS)
      const primaryRadius =
        Number.isFinite(envRadius) && envRadius > 0 ? envRadius : DEFAULT_SEARCH_RADIUS_METERS

      let rows = await fetchCounselingCentersRows(userOrigin.lat, userOrigin.lng, primaryRadius)
      let distanceFromUser = true
      if (rows.length === 0) {
        rows = await fetchCounselingCentersRows(
          MELBOURNE_CENTER.lat,
          MELBOURNE_CENTER.lng,
          CBD_ANCHOR_FALLBACK_RADIUS_METERS,
        )
        distanceFromUser = false
      }

      rooms.value = rows.map((item) => {
        const position = { lat: Number(item.latitude), lng: Number(item.longitude) }
        const meters = distanceFromUser
          ? Number(item.distance_meters)
          : haversineMeters(userOrigin, position)
        return {
          id: item.id,
          name: item.name,
          address: item.address,
          position,
          distanceText: formatDistanceMeters(meters),
          durationText: '',
        }
      })
      sortRoomsByWalkingDistance()
    } catch (err) {
      console.error('counseling-centers', err)
      rooms.value = []
      roomsFetchError.value =
        'Unable to load nearby counseling centers. Please try again later, or check your network and API configuration (CORS must allow your site in production).'
    } finally {
      loadingRooms.value = false
    }
  }

  async function updateDistanceDurationForAll(origin, mapApi) {
    if (!mapApi || rooms.value.length === 0) return

    const service = new mapApi.DistanceMatrixService()
    const list = rooms.value
    const elementsByIndex = []

    for (let offset = 0; offset < list.length; offset += DISTANCE_BATCH_MAX_DESTINATIONS) {
      const slice = list.slice(offset, offset + DISTANCE_BATCH_MAX_DESTINATIONS)
      const destinations = slice.map((room) => room.position)
      const result = await service.getDistanceMatrix({
        origins: [origin],
        destinations,
        travelMode: mapApi.TravelMode.WALKING,
        unitSystem: mapApi.UnitSystem.METRIC,
      })
      const row = result?.rows?.[0]?.elements || []
      for (let i = 0; i < slice.length; i++) {
        elementsByIndex[offset + i] = row[i]
      }
    }

    rooms.value = rooms.value.map((room, index) => {
      const info = elementsByIndex[index]
      if (!info || info.status !== 'OK') return room
      return {
        ...room,
        distanceText: info.distance?.text || room.distanceText,
        durationText: info.duration?.text || room.durationText,
      }
    })
    sortRoomsByWalkingDistance()
  }

  const filteredRooms = computed(() => {
    if (!filterCenter.value) return rooms.value

    const anchor = filterCenter.value
    const withDistance = rooms.value.map((room) => ({
      room,
      meters: haversineMeters(anchor, room.position),
    }))

    let nearRooms = withDistance.filter((item) => item.meters <= NEARBY_DISTANCE_METERS)
    if (nearRooms.length === 0) {
      nearRooms = withDistance
    }

    return nearRooms.sort((a, b) => a.meters - b.meters).map((item) => item.room)
  })

  const selectedRoom = computed(
    () => rooms.value.find((room) => room.id === selectedRoomId.value) || null,
  )

  const displayedRooms = computed(() => {
    if (selectedRoom.value) return [selectedRoom.value]
    return filteredRooms.value
  })

  return {
    displayedRooms,
    filteredRooms,
    loadingRooms,
    rooms,
    roomsFetchError,
    selectedRoom,
    fetchRoomsNearby,
    updateDistanceDurationForAll,
  }
}
