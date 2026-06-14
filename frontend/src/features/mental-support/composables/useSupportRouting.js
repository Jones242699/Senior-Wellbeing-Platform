import { ref } from 'vue'
import { MELBOURNE_CENTER } from '../constants'

export function useSupportRouting({
  clearSelectedRoute,
  drawRoute,
  filterCenter,
  rooms,
  selectedRoomId,
  userPosition,
}) {
  const travelMode = ref('WALKING')
  const routing = ref(false)

  function getRouteOrigin() {
    return filterCenter.value || userPosition.value || MELBOURNE_CENTER
  }

  async function selectRoomAndRoute(room) {
    selectedRoomId.value = room.id

    routing.value = true
    try {
      await drawRoute(getRouteOrigin(), room.position, travelMode.value)
    } finally {
      routing.value = false
    }
  }

  async function generateSelectedRoute() {
    const selectedRoom = rooms.value.find((room) => room.id === selectedRoomId.value)
    if (!selectedRoom) return

    routing.value = true
    try {
      await drawRoute(getRouteOrigin(), selectedRoom.position, travelMode.value)
    } finally {
      routing.value = false
    }
  }

  function clearSelectedRoom() {
    selectedRoomId.value = null
    clearSelectedRoute()
  }

  async function selectTravelMode(modeId) {
    travelMode.value = modeId
    await generateSelectedRoute()
  }

  return {
    routing,
    travelMode,
    clearSelectedRoom,
    selectRoomAndRoute,
    selectTravelMode,
  }
}
