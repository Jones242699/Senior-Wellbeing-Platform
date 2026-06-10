<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const DEFAULT_EVENTS_API_BASE = 'https://k2algu70g6.execute-api.ap-southeast-2.amazonaws.com'

function pickValidApiBase(...candidates) {
  for (const raw of candidates) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) continue
    if (/xxxx|example|your-api/i.test(value)) continue
    const normalized = value.replace(/\/$/, '')
    try {
      const parsed = new URL(normalized)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return normalized
    } catch {
      // ignore invalid URL candidate
    }
  }
  return DEFAULT_EVENTS_API_BASE
}

const route = useRoute()
const loading = ref(false)
const errorText = ref('')
const detail = ref(null)

const firstImage = computed(() => detail.value?.images?.[0]?.url || '')
const venue = computed(() => detail.value?.venue || null)
const priceRange = computed(() => detail.value?.priceRanges || null)
const originPoint = computed(() => {
  const lat = Number(route.query.originLat)
  const lng = Number(route.query.originLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
})

function formatDistance(distanceKm) {
  const numeric = Number(distanceKm)
  if (!Number.isFinite(numeric)) return '--'
  if (numeric < 1) return `${Math.round(numeric * 1000)} m`
  return `${numeric.toFixed(2)} km`
}

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)))
}

const computedDistanceFromOrigin = computed(() => {
  const origin = originPoint.value
  const venueLat = Number(venue.value?.latitude)
  const venueLng = Number(venue.value?.longitude)
  if (!origin || !Number.isFinite(venueLat) || !Number.isFinite(venueLng)) return null
  return haversineKm(origin, { lat: venueLat, lng: venueLng })
})

const displayDistance = computed(() => {
  const queryDistance = Number(route.query.distance)
  if (Number.isFinite(queryDistance)) return formatDistance(queryDistance)

  if (Number.isFinite(computedDistanceFromOrigin.value)) {
    return formatDistance(computedDistanceFromOrigin.value)
  }

  const detailDistance = Number(detail.value?.distance)
  if (Number.isFinite(detailDistance)) return formatDistance(detailDistance)

  return '--'
})

async function fetchDetail() {
  loading.value = true
  errorText.value = ''
  detail.value = null
  try {
    const eventId = route.params.id
    const base = pickValidApiBase(import.meta.env.VITE_EVENTS_API_BASE)
    const response = await fetch(`${base}/events/${eventId}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    detail.value = await response.json()
  } catch (error) {
    console.error('event-detail', error)
    errorText.value = 'Failed to load event detail. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <main class="detail-page">
    <router-link to="/nearby-events" class="back-link">← Back to Events</router-link>

    <div v-if="loading" class="state">Loading event detail...</div>
    <div v-else-if="errorText" class="state state--error">{{ errorText }}</div>

    <article v-else-if="detail" class="card">
      <img v-if="firstImage" :src="firstImage" :alt="detail.name" class="banner" />
      <div class="body">
        <p class="meta">
          {{ detail.classification || 'Event' }} · {{ detail.source || 'Ticketmaster' }}
        </p>
        <h1>{{ detail.name }}</h1>
        <p class="line"><strong>Date:</strong> {{ detail.date || '--' }}</p>
        <p class="line"><strong>Distance:</strong> {{ displayDistance }}</p>

        <p v-if="venue" class="line">
          <strong>Venue:</strong>
          {{ venue.name }} · {{ venue.address }}, {{ venue.city }}
        </p>

        <p v-if="priceRange" class="line">
          <strong>Price:</strong>
          {{ priceRange.min }} - {{ priceRange.max }} {{ priceRange.currency }}
        </p>

        <section v-if="detail.description" class="section">
          <h2>Description</h2>
          <p>{{ detail.description }}</p>
        </section>

        <section v-if="detail.pleaseNote" class="section">
          <h2>Please Note</h2>
          <p>{{ detail.pleaseNote }}</p>
        </section>

        <div class="actions">
          <a
            v-if="detail.ticketUrl"
            :href="detail.ticketUrl"
            target="_blank"
            rel="noreferrer"
            class="ticket-btn"
          >
            Book Tickets
          </a>
          <a
            v-if="venue?.latitude && venue?.longitude"
            :href="`https://www.openstreetmap.org/?mlat=${venue.latitude}&mlon=${venue.longitude}#map=16/${venue.latitude}/${venue.longitude}`"
            target="_blank"
            rel="noreferrer"
            class="map-btn"
          >
            Open in OpenStreetMap
          </a>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.detail-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 24px 30px;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.back-link {
  display: inline-block;
  margin-bottom: 14px;
  color: #166534;
  text-decoration: none;
  font-weight: 700;
}

.state {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 12px;
  color: #475569;
}

.state--error {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.banner {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  background: #e2e8f0;
}

.body {
  padding: 18px;
}

.meta {
  margin: 0 0 8px;
  font-size: 13px;
  color: #64748b;
}

h1 {
  margin: 0 0 14px;
  color: #1f2937;
}

.line {
  margin: 0 0 10px;
  color: #334155;
}

.section {
  margin-top: 14px;
}

h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 18px;
}

.section p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.ticket-btn,
.map-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
}

.ticket-btn {
  color: #ffffff;
  background: #16a34a;
}

.map-btn {
  color: #14532d;
  border: 1px solid #16a34a;
  background: #f0fdf4;
}
</style>
