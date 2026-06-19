import { resolvePlaceFromQuery } from './placeHelpers'

export function buildAddressCandidates(address) {
  const raw = String(address || '').trim()
  if (!raw) return []
  const candidates = [raw]

  const withoutRelativePrefix = raw.replace(
    /.*?\b(?:approximately|approx\.?|about)\b[^,]*\b(?:of|from)\b\s*/i,
    '',
  )
  if (withoutRelativePrefix && withoutRelativePrefix !== raw) {
    candidates.push(withoutRelativePrefix.trim())
  }

  const addressTailMatch = raw.match(/\d+\s+[^,]+(?:,\s*[^,]+){1,4}/)
  if (addressTailMatch?.[0]) candidates.push(addressTailMatch[0].trim())

  return [...new Set(candidates)]
}

function geocodeAddress(address, getGeocoder) {
  return new Promise((resolve, reject) => {
    const geocoder = getGeocoder?.()
    if (!geocoder) {
      reject(new Error('Geocoder unavailable'))
      return
    }

    geocoder.geocode({ address, region: 'au' }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        resolve({
          location: results[0].geometry.location,
          formattedAddress: results[0].formatted_address || address,
          name: results[0].name || address,
        })
        return
      }
      reject(new Error(`Geocode failed (${status || 'UNKNOWN'})`))
    })
  })
}

export function reverseGeocodeLocation({ getGeocoder, mapApi, position }) {
  return new Promise((resolve) => {
    const geocoder = getGeocoder?.() || (mapApi?.Geocoder ? new mapApi.Geocoder() : null)
    if (!geocoder?.geocode) {
      resolve(null)
      return
    }

    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results?.length) {
        const streetAddress =
          results.find((result) =>
            result.types?.some((type) =>
              ['street_address', 'premise', 'subpremise', 'route'].includes(type),
            ),
          ) || results[0]
        if (streetAddress?.formatted_address) {
          resolve({
            location: streetAddress.geometry?.location || position,
            formattedAddress: streetAddress.formatted_address,
            name: streetAddress.name || streetAddress.formatted_address,
          })
          return
        }
      }
      resolve(null)
    })
  })
}

function findPlaceByText(address, mapApi, placesService) {
  if (!placesService || !mapApi?.places) {
    return Promise.reject(new Error('Places service unavailable'))
  }

  return resolvePlaceFromQuery({
    address,
    mapApi,
    placesService,
    rejectMessage: (status) => `Place lookup failed (${status || 'UNKNOWN'})`,
  }).then((place) => ({
    location: place.place.geometry.location,
    formattedAddress: place.formattedAddress || address,
    name: place.name || address,
  }))
}

export async function resolveAddressInput({
  address,
  getGeocoder,
  mapApi,
  placesService,
  failureMessage,
}) {
  const candidates = buildAddressCandidates(address)

  for (const candidate of candidates) {
    try {
      return await geocodeAddress(candidate, getGeocoder)
    } catch {
      // try next candidate
    }
  }

  for (const candidate of candidates) {
    try {
      return await findPlaceByText(candidate, mapApi, placesService)
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    failureMessage ||
      `Unable to resolve address: "${address}". Please select an autocomplete suggestion or check spelling.`,
  )
}
