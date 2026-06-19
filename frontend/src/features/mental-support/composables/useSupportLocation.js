import { MELBOURNE_CENTER } from '../constants'
import { reverseGeocodeLocation } from '../../../shared/map/addressResolver'
import {
  GEOLOCATION_PERMISSION_ERROR,
  LOCATION_ACCESS_ERROR,
  buildOutsideSupportedAreaMessage,
  getGeolocationErrorMessage,
  getGeolocationPermissionState,
  isWithinBounds,
} from '../../../shared/map/locationRules'

export function useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
  setCurrentLocationPlace,
  setLocationError,
  setUserMarker,
}) {
  async function loadRoomsForOrigin(origin) {
    await fetchRoomsNearby(origin)
    renderRoomMarkers(rooms.value, selectRoomAndRoute)
  }

  async function locateUser() {
    // Explicitly switch back to realtime location as the route/list origin.
    clearAddressFilterState()
    clearSelectedRoom()

    if (!navigator.geolocation) {
      setLocationError?.(LOCATION_ACCESS_ERROR)
      await loadRoomsForOrigin(MELBOURNE_CENTER)
      return
    }

    const permissionState = await getGeolocationPermissionState()
    if (permissionState === 'denied') {
      setLocationError?.(GEOLOCATION_PERMISSION_ERROR)
      setUserMarker(null)
      await loadRoomsForOrigin(MELBOURNE_CENTER)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude }
        if (!isWithinBounds(current)) {
          setLocationError?.(buildOutsideSupportedAreaMessage('Current location'))
          setUserMarker(null)
          await loadRoomsForOrigin(MELBOURNE_CENTER)
          return
        }

        let resolvedAddress = null
        try {
          resolvedAddress = await reverseGeocodeLocation({
            getGeocoder: null,
            mapApi: getMapApi(),
            position: current,
          })
        } catch {
          resolvedAddress = null
        }

        if (!resolvedAddress?.formattedAddress) {
          setLocationError?.(
            'Unable to convert your current location into an address. Please enter a City of Melbourne address manually.',
          )
          setUserMarker(null)
          await loadRoomsForOrigin(MELBOURNE_CENTER)
          return
        }

        setLocationError?.('')
        setCurrentLocationPlace?.({
          ...current,
          formattedAddress: resolvedAddress.formattedAddress,
          name: resolvedAddress.name || resolvedAddress.formattedAddress,
        })
        setUserMarker(current)
        panTo(current)
        await loadRoomsForOrigin(current)
      },
      async (error) => {
        setLocationError?.(getGeolocationErrorMessage(error))
        setUserMarker(null)
        await loadRoomsForOrigin(MELBOURNE_CENTER)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  async function loadDefaultLocation() {
    clearAddressFilterState()
    clearSelectedRoom()
    setLocationError?.('')
    await loadRoomsForOrigin(MELBOURNE_CENTER)
  }

  return {
    loadDefaultLocation,
    locateUser,
  }
}
