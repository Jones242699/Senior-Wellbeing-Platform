import { ref } from 'vue'
import { getApiBase } from '../../../config/api'
import { clearMarkers, createCircleMarker, createMapMarker } from '../../../shared/map/markerHelpers'
import { MAX_BENCH_MARKERS_ON_ROUTE_MAP, ROUTE_FACILITIES_DISTANCE_METERS } from '../constants'

export function useRouteFacilities({ getInfoWindow, getMap, getMapApi }) {
  const loadingFacilities = ref(false)
  const facilityCounts = ref({ toilets: 0, benches: 0 })

  let toiletMarkers = []
  let benchMarkers = []

  function resetFacilityState() {
    facilityCounts.value = { toilets: 0, benches: 0 }
  }

  function clearToiletMarkers() {
    clearMarkers(toiletMarkers)
  }

  function clearBenchMarkers() {
    clearMarkers(benchMarkers)
  }

  function createToiletMarker(toilet) {
    if (!toilet.latitude || !toilet.longitude) return
    const mapApi = getMapApi()
    const map = getMap()
    const infoWindow = getInfoWindow()
    const position = {
      lat: Number(toilet.latitude),
      lng: Number(toilet.longitude),
    }
    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return

    const marker = createMapMarker(mapApi, map, {
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
    if (!marker) return

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

  function buildRouteFacilitiesFetchUrl() {
    if (import.meta.env.DEV) {
      return '/__route-facilities/route-facilities'
    }
    const base = getApiBase(import.meta.env.VITE_ROUTE_FACILITIES_API_BASE)
    return `${base}/route-facilities`
  }

  function createBenchMarker(bench) {
    if (!bench.lat || !bench.lng) return

    const mapApi = getMapApi()
    const map = getMap()
    const infoWindow = getInfoWindow()
    const marker = createCircleMarker(mapApi, map, {
      position: { lat: parseFloat(bench.lat), lng: parseFloat(bench.lng) },
      title: bench.desc || 'Rest Bench',
      zIndex: 750,
      scale: 14,
      fillColor: '#d99a2b',
      strokeColor: '#ffffff',
      strokeWeight: 2,
      label: {
        text: 'B',
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: '800',
      },
    })
    if (!marker) return

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
      loadingFacilities.value = false
      return
    }

    const routePath = getRoutePath(route)
    if (routePath.length === 0) {
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
    } finally {
      loadingFacilities.value = false
    }
  }

  return {
    facilityCounts,
    loadingFacilities,
    clearBenchMarkers,
    clearToiletMarkers,
    fetchFacilitiesForRoute,
    resetFacilityState,
  }
}
