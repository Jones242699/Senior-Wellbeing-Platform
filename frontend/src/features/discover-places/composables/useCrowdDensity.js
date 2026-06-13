import {
  calculateDistanceMeters,
  normalizeApiPayload,
  parsePlacesPayload,
  pickFirstDefined,
  toDegrees,
  toFiniteNumber,
  toRadians,
} from './useDiscoverPlaces'

export const CROWD_DENSITY_DEFAULT_LIMIT = 180
export const CROWD_DENSITY_MIN_RADIUS = 500
export const CROWD_DENSITY_MAX_POINTS_PER_GROUP = 14
export const CROWD_DENSITY_FALLBACK_MAX_NEIGHBOR_DISTANCE_METERS = 280
export const CROWD_DENSITY_SINGLE_POINT_HALF_SPAN_METERS = 130
export const CROWD_DENSITY_MAX_ROUTE_GROUPS_PER_RENDER = 120
export const CROWD_DENSITY_MAX_ADDRESS_DERIVED_GROUPS = 140

export const CROWD_DENSITY_COLORS = {
  quiet: '#22c55e',
  moderate: '#f59e0b',
  busy: '#ef4444',
}

export const CROWD_DENSITY_LEGEND = [
  { key: 'busy', label: 'Crowded', color: CROWD_DENSITY_COLORS.busy },
  { key: 'moderate', label: 'Moderate', color: CROWD_DENSITY_COLORS.moderate },
  { key: 'quiet', label: 'Quiet', color: CROWD_DENSITY_COLORS.quiet },
]

export function normalizeCrowdDensityLevel(rawLevel) {
  const level = String(rawLevel || '')
    .trim()
    .toLowerCase()
  if (!level) return ''
  if (level === 'quiet' || level === 'low' || level === 'empty') return 'quiet'
  if (level === 'busy' || level === 'crowded' || level === 'high') return 'busy'
  if (level === 'moderate' || level === 'medium' || level === 'normal') return 'moderate'
  return ''
}

export function crowdLevelWeight(level) {
  if (level === 'busy') return 3
  if (level === 'moderate') return 2
  return 1
}

function deriveCrowdLevelFromVolume(volume) {
  const value = toFiniteNumber(volume)
  if (value === null) return 'moderate'
  if (value >= 80) return 'busy'
  if (value >= 15) return 'moderate'
  return 'quiet'
}

function resolveCrowdDensityLevel(rawLevel, volume) {
  const fromApi = normalizeCrowdDensityLevel(rawLevel)
  const fromVolume = deriveCrowdLevelFromVolume(volume)
  if (!fromApi) return fromVolume
  // When API level is stale (e.g. all "quiet"), use volume so map matches sensor intensity.
  if (crowdLevelWeight(fromVolume) > crowdLevelWeight(fromApi)) return fromVolume
  return fromApi
}

export function parseCrowdDensityPayload(payload) {
  const normalized = normalizeApiPayload(payload)
  const streetRows = Array.isArray(normalized?.results)
    ? normalized.results
    : Array.isArray(normalized?.data)
      ? normalized.data
      : []

  const flattened = []
  streetRows.forEach((street, streetIndex) => {
    const streetName = String(street?.street_name || street?.streetName || '').trim()
    const peakVolume = toFiniteNumber(street?.peak_volume ?? street?.peakVolume)
    const sensors = Array.isArray(street?.sensors) ? street.sensors : []

    if (sensors.length) {
      sensors.forEach((sensor, sensorIndex) => {
        const lat = toFiniteNumber(sensor?.lat)
        const lng = toFiniteNumber(sensor?.lng)
        if (lat === null || lng === null) return
        const volume = toFiniteNumber(sensor?.volume) ?? peakVolume ?? 0
        const level = resolveCrowdDensityLevel(
          pickFirstDefined(sensor?.level, street?.level),
          peakVolume ?? volume,
        )
        flattened.push({
          street_name: streetName,
          street_level: level,
          streetPeakVolume: peakVolume,
          level,
          lat,
          lng,
          volume,
          sensor_id: `${streetIndex}-${sensorIndex}`,
        })
      })
      return
    }

    const lat = toFiniteNumber(street?.lat)
    const lng = toFiniteNumber(street?.lng)
    if (lat === null || lng === null) return
    const level = resolveCrowdDensityLevel(street?.level, peakVolume)
    flattened.push({
      street_name: streetName,
      street_level: level,
      streetPeakVolume: peakVolume,
      level,
      lat,
      lng,
      volume: peakVolume ?? 0,
      sensor_id: `street-${streetIndex}`,
    })
  })

  if (flattened.length) return flattened

  return parsePlacesPayload(normalized).filter(
    (item) => toFiniteNumber(item?.lat) !== null && toFiniteNumber(item?.lng) !== null,
  )
}

export function normalizeCrowdDensityRecord(input, index) {
  const lat = toFiniteNumber(input?.lat)
  const lng = toFiniteNumber(input?.lng)
  const volume = toFiniteNumber(input?.volume)
  if (lat === null || lng === null) return null
  const level = resolveCrowdDensityLevel(
    pickFirstDefined(input?.level, input?.street_level, input?.streetLevel),
    volume,
  )
  return {
    id: String(pickFirstDefined(input.sensor_id, input.sensorId, `sensor-${index}`)),
    lat,
    lng,
    level,
    volume: volume ?? 0,
    streetName: String(pickFirstDefined(input.street_name, input.streetName, '') || '').trim(),
    streetLevel: normalizeCrowdDensityLevel(
      pickFirstDefined(input?.street_level, input?.streetLevel, input?.level),
    ),
    streetPeakVolume: toFiniteNumber(input?.streetPeakVolume ?? input?.peak_volume),
  }
}

function resolveHigherCrowdLevel(firstLevel, secondLevel) {
  return crowdLevelWeight(firstLevel) >= crowdLevelWeight(secondLevel) ? firstLevel : secondLevel
}

function sortRoadPoints(records) {
  if (records.length <= 2) return records
  const latMin = Math.min(...records.map((item) => item.lat))
  const latMax = Math.max(...records.map((item) => item.lat))
  const lngMin = Math.min(...records.map((item) => item.lng))
  const lngMax = Math.max(...records.map((item) => item.lng))
  const sortByLng = lngMax - lngMin >= latMax - latMin
  return [...records].sort((a, b) => (sortByLng ? a.lng - b.lng : a.lat - b.lat))
}

export function buildGroupedRoadOverlays(records, roadLabelByRecordId) {
  if (!Array.isArray(records) || records.length < 2) return []

  const groupsByRoad = new Map()
  records.forEach((record) => {
    const roadLabel = String(record.streetName || roadLabelByRecordId.get(record.id) || '').trim()
    if (!roadLabel) return
    const existingGroup = groupsByRoad.get(roadLabel) || []
    existingGroup.push(record)
    groupsByRoad.set(roadLabel, existingGroup)
  })

  const candidateGroups = [...groupsByRoad.entries()]
    .map(([roadLabel, groupRecords]) => {
      const sortedRecords = sortRoadPoints(groupRecords)
      return {
        roadLabel,
        records: sortedRecords.slice(0, CROWD_DENSITY_MAX_POINTS_PER_GROUP),
        score:
          sortedRecords.reduce((sum, item) => sum + crowdLevelWeight(item.level), 0) +
          Math.min(sortedRecords.length, 8),
      }
    })
    .filter((group) => group.records.length >= 1)
    .sort((a, b) => b.score - a.score)

  return candidateGroups.map((group) => {
    const peakVolume = Math.max(
      ...group.records.map((item) => {
        const recordPeak = toFiniteNumber(item.streetPeakVolume)
        const recordVolume = toFiniteNumber(item.volume)
        return recordPeak ?? recordVolume ?? 0
      }),
      0,
    )
    const apiLevel = group.records
      .map(
        (item) =>
          normalizeCrowdDensityLevel(item.streetLevel) || normalizeCrowdDensityLevel(item.level),
      )
      .find(Boolean)
    const level = resolveCrowdDensityLevel(apiLevel, peakVolume)
    return { roadLabel: group.roadLabel, records: group.records, level }
  })
}

export function buildFallbackRoadOverlays(records) {
  if (!Array.isArray(records) || records.length < 2) return []
  const sorted = [...records].sort((a, b) => {
    const levelDiff = crowdLevelWeight(b.level) - crowdLevelWeight(a.level)
    if (levelDiff !== 0) return levelDiff
    return (b.volume || 0) - (a.volume || 0)
  })
  const used = new Set()
  const overlays = []

  sorted.forEach((record) => {
    if (used.has(record.id)) return
    let nearest = null
    let nearestDistance = Number.POSITIVE_INFINITY
    sorted.forEach((candidate) => {
      if (candidate.id === record.id || used.has(candidate.id)) return
      const distance = calculateDistanceMeters(
        { lat: record.lat, lng: record.lng },
        { lat: candidate.lat, lng: candidate.lng },
      )
      if (distance > CROWD_DENSITY_FALLBACK_MAX_NEIGHBOR_DISTANCE_METERS) return
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = candidate
      }
    })
    if (!nearest) return
    used.add(record.id)
    used.add(nearest.id)
    overlays.push({
      roadLabel: `fallback-${record.id}-${nearest.id}`,
      records: [record, nearest],
      level: resolveHigherCrowdLevel(record.level, nearest.level),
    })
  })

  return overlays
}

function projectPointByMeters(start, distanceMeters, bearingRadians) {
  const earthRadiusMeters = 6371000
  const angularDistance = distanceMeters / earthRadiusMeters
  const lat1 = toRadians(start.lat)
  const lng1 = toRadians(start.lng)
  const sinLat1 = Math.sin(lat1)
  const cosLat1 = Math.cos(lat1)
  const sinAd = Math.sin(angularDistance)
  const cosAd = Math.cos(angularDistance)

  const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearingRadians))
  const lng2 =
    lng1 + Math.atan2(Math.sin(bearingRadians) * sinAd * cosLat1, cosAd - sinLat1 * Math.sin(lat2))

  return { lat: toDegrees(lat2), lng: toDegrees(lng2) }
}

export function buildLocalFallbackPathForGroup(group) {
  if (!group?.records?.length) return []
  if (group.records.length === 1) {
    const point = group.records[0]
    const start = projectPointByMeters(
      { lat: point.lat, lng: point.lng },
      CROWD_DENSITY_SINGLE_POINT_HALF_SPAN_METERS,
      Math.PI,
    )
    const end = projectPointByMeters(
      { lat: point.lat, lng: point.lng },
      CROWD_DENSITY_SINGLE_POINT_HALF_SPAN_METERS,
      0,
    )
    return [start, { lat: point.lat, lng: point.lng }, end]
  }
  if (group.records.length === 2) {
    const [first, last] = group.records
    return [
      { lat: first.lat, lng: first.lng },
      { lat: last.lat, lng: last.lng },
    ]
  }
  return group.records.map((item) => ({ lat: item.lat, lng: item.lng }))
}

function deriveRoadLabelFromAddress(address) {
  const text = String(address || '').trim()
  if (!text) return ''
  const firstPart = text.split(',')[0]?.trim() || ''
  if (!firstPart) return ''
  return firstPart
    .replace(/\b(unit|suite|apt|apartment|level)\b\.?\s*\w*/gi, '')
    .replace(/^\d+\s*/g, '')
    .trim()
}

function findNearestCrowdLevelForPoint(point, crowdRecords) {
  if (!Array.isArray(crowdRecords) || !crowdRecords.length) return 'moderate'
  let nearestLevel = 'moderate'
  let nearestDistance = Number.POSITIVE_INFINITY
  crowdRecords.forEach((record) => {
    const distance = calculateDistanceMeters(
      { lat: point.lat, lng: point.lng },
      { lat: record.lat, lng: record.lng },
    )
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestLevel = record.level
    }
  })
  return nearestLevel
}

export function buildAddressDerivedRoadGroups(places, existingRoadLabelSet, crowdRecords) {
  if (!Array.isArray(places) || !places.length) return []
  const groupsByRoad = new Map()

  places.forEach((place) => {
    if (!Number.isFinite(place?.lat) || !Number.isFinite(place?.lng)) return
    const roadLabel = deriveRoadLabelFromAddress(place.address)
    if (!roadLabel) return
    if (existingRoadLabelSet.has(roadLabel)) return
    if (groupsByRoad.has(roadLabel)) return
    const level = findNearestCrowdLevelForPoint({ lat: place.lat, lng: place.lng }, crowdRecords)
    groupsByRoad.set(roadLabel, {
      roadLabel,
      records: [
        {
          id: `address-road-${roadLabel}`,
          lat: place.lat,
          lng: place.lng,
          level,
          volume: 0,
        },
      ],
      level,
    })
  })

  return [...groupsByRoad.values()].slice(0, CROWD_DENSITY_MAX_ADDRESS_DERIVED_GROUPS)
}
