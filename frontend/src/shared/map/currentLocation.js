import { reverseGeocodeLocation } from './addressResolver'
import {
  GEOLOCATION_PERMISSION_ERROR,
  LOCATION_ACCESS_ERROR,
  assertWithinSupportedArea,
  getGeolocationErrorMessage,
  getGeolocationPermissionState,
} from './locationRules'

export const CURRENT_LOCATION_REVERSE_GEOCODE_ERROR =
  'Unable to convert your current location into an address. Please enter a City of Melbourne address manually.'

const DEFAULT_CURRENT_LOCATION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 60000,
}

function getBrowserPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({ lat: coords.latitude, lng: coords.longitude })
      },
      (error) => {
        reject(new Error(getGeolocationErrorMessage(error)))
      },
      {
        ...DEFAULT_CURRENT_LOCATION_OPTIONS,
        ...options,
      },
    )
  })
}

export async function resolveCurrentLocation({
  getGeocoder = null,
  getMapApi,
  label = 'Current location',
  positionOptions,
} = {}) {
  if (!navigator.geolocation) {
    throw new Error(LOCATION_ACCESS_ERROR)
  }

  const permissionState = await getGeolocationPermissionState()
  if (permissionState === 'denied') {
    throw new Error(GEOLOCATION_PERMISSION_ERROR)
  }

  const position = assertWithinSupportedArea(await getBrowserPosition(positionOptions), label)
  return resolveCurrentLocationAddress({
    getGeocoder,
    getMapApi,
    label,
    position,
  })
}

export async function resolveCurrentLocationAddress({
  getGeocoder = null,
  getMapApi,
  label = 'Current location',
  position,
} = {}) {
  const checkedPosition = assertWithinSupportedArea(position, label)
  const mapApi = typeof getMapApi === 'function' ? await getMapApi() : getMapApi
  const resolvedAddress = await reverseGeocodeLocation({
    getGeocoder,
    mapApi,
    position: checkedPosition,
  })

  if (!resolvedAddress?.formattedAddress) {
    throw new Error(CURRENT_LOCATION_REVERSE_GEOCODE_ERROR)
  }

  return {
    position: checkedPosition,
    place: {
      ...checkedPosition,
      formattedAddress: resolvedAddress.formattedAddress,
      name: resolvedAddress.name || resolvedAddress.formattedAddress,
    },
    resolvedAddress,
  }
}
