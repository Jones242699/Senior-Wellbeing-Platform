<script setup>
import SupportFilters from '../../mental-support/components/SupportFilters.vue'
import SupportList from '../../mental-support/components/SupportList.vue'

defineProps({
  addressFilterError: { type: String, default: '' },
  applyingAddressFilter: { type: Boolean, required: true },
  displayedRooms: { type: Array, required: true },
  loadingSuggestions: { type: Boolean, default: false },
  loadingRooms: { type: Boolean, required: true },
  locationLabel: { type: String, required: true },
  query: { type: String, required: true },
  roomsFetchError: { type: String, default: '' },
  supportDetailRoom: { type: Object, default: null },
  selectedRoomId: { type: [String, Number], default: null },
  suggestions: { type: Array, default: () => [] },
})

defineEmits([
  'apply-address-filter',
  'close-detail',
  'directions',
  'more-info',
  'query-input',
  'select-room',
  'select-suggestion',
  'update:query',
  'use-my-location',
])

const WEEKDAY_LABELS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
]

function normalizeExternalUrl(url) {
  const text = String(url || '').trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

function formatRating(rating) {
  if (rating === null || rating === undefined || rating === '') return 'Not rated'
  return `${rating} / 5`
}

function formatHours(openHours, dayKey) {
  return openHours?.[dayKey] || 'Not available'
}
</script>

<template>
  <aside class="explore-support-panel">
    <div class="explore-panel-heading">
      <p>Mental support</p>
      <h1>Mental Support</h1>
    </div>
    <p class="explore-location-status">Using {{ locationLabel }}</p>

    <SupportFilters
      :query="query"
      :address-filter-error="addressFilterError"
      :applying-address-filter="applyingAddressFilter"
      :loading-suggestions="loadingSuggestions"
      :suggestions="suggestions"
      @update:query="$emit('update:query', $event)"
      @apply-address-filter="$emit('apply-address-filter')"
      @query-input="$emit('query-input')"
      @select-suggestion="$emit('select-suggestion', $event)"
      @use-my-location="$emit('use-my-location')"
    />

    <SupportList
      :displayed-rooms="displayedRooms"
      :loading-rooms="loadingRooms"
      :rooms-fetch-error="roomsFetchError"
      :selected-room-id="selectedRoomId"
      @more-info="$emit('more-info', $event)"
      @directions="$emit('directions', $event)"
      @select-room="$emit('select-room', $event)"
    />

    <Transition name="support-detail">
      <section v-if="supportDetailRoom" class="support-detail-drawer" aria-label="Support room details">
        <header class="support-detail-header">
          <button type="button" class="support-detail-close" @click="$emit('close-detail')">
            Close
          </button>
          <span>Counseling room</span>
          <h2>{{ supportDetailRoom.name }}</h2>
        </header>

        <div class="support-detail-body">
          <section class="support-detail-section">
            <h3>Contact</h3>
            <dl class="support-detail-list">
              <div>
                <dt>Address</dt>
                <dd>{{ supportDetailRoom.address || 'Not available' }}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{{ supportDetailRoom.phone || 'Not available' }}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  <a
                    v-if="supportDetailRoom.website"
                    :href="normalizeExternalUrl(supportDetailRoom.website)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open website
                  </a>
                  <span v-else>Not available</span>
                </dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>{{ formatRating(supportDetailRoom.rating) }}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{{ supportDetailRoom.distanceText || 'Not available' }}</dd>
              </div>
            </dl>
          </section>

          <section class="support-detail-section">
            <h3>Opening Hours</h3>
            <dl class="support-hours-list">
              <div v-for="[dayKey, label] in WEEKDAY_LABELS" :key="dayKey">
                <dt>{{ label }}</dt>
                <dd>{{ formatHours(supportDetailRoom.openHours, dayKey) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <footer class="support-detail-actions">
          <button type="button" class="support-detail-direction" @click="$emit('directions', supportDetailRoom)">
            Direction
          </button>
        </footer>
      </section>
    </Transition>
  </aside>
</template>

<style scoped>
.explore-support-panel {
  margin-top: 16px;
  position: relative;
}

.explore-support-panel :deep(.top-bar) {
  align-items: stretch;
  background: transparent;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 12px;
  padding: 0;
}

.explore-location-status {
  margin: 10px 0 0;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  padding: 9px 11px;
  font-size: calc(13px * var(--font-scale, 1));
  font-weight: 700;
}

.explore-support-panel :deep(.back-link-top) {
  display: none;
}

.explore-support-panel :deep(.search-wrapper) {
  max-width: none;
  width: 100%;
}

.explore-support-panel :deep(.search-row) {
  align-items: stretch;
  display: flex;
  gap: 0;
}

.explore-support-panel :deep(.search-input-shell) {
  flex: 1 1 auto;
  min-width: 0;
  position: relative;
}

.explore-support-panel :deep(.address-suggestion-input) {
  width: 100%;
}

.explore-support-panel :deep(.search-action-btn),
.explore-support-panel :deep(.location-btn) {
  width: auto;
  white-space: nowrap;
}

.explore-support-panel :deep(.search-input) {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #d1d5db;
  border-right: 0;
  border-radius: 8px 0 0 8px;
  background: #ffffff;
  height: 46px;
  padding: 11px 12px;
  font-size: calc(14px * var(--font-scale, 1));
  outline: none;
}

.explore-support-panel :deep(.search-input:focus) {
  border-color: #4f7c65;
  box-shadow: 0 0 0 3px rgba(79, 124, 101, 0.16);
}

.explore-support-panel :deep(.search-action-btn),
.explore-support-panel :deep(.location-btn) {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  height: 46px;
  min-height: 46px;
  padding: 10px;
}

.explore-support-panel :deep(.search-action-btn) {
  border-radius: 0 8px 8px 0;
  background: #4f7c65;
  color: #ffffff;
  min-width: 86px;
}

.explore-support-panel :deep(.location-btn) {
  border: 1px solid #d1d5db;
  border-right: 0;
  border-radius: 0;
  background: #edf4ef;
  color: #4f7c65;
  font-size: calc(12px * var(--font-scale, 1));
  min-width: 88px;
}

.explore-support-panel :deep(.search-action-btn:hover:not(:disabled)) {
  background: #3f6652;
}

.explore-support-panel :deep(.location-btn:hover) {
  background: #e2eee7;
  color: #3f6652;
}

.explore-support-panel :deep(.search-error) {
  color: #b91c1c;
  font-size: calc(12px * var(--font-scale, 1));
  margin: 6px 0 0;
}

.explore-support-panel :deep(.list-panel) {
  background: transparent;
  margin-top: 14px;
  max-height: calc(100dvh - 410px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0;
}

.explore-support-panel :deep(.state-tip) {
  border-radius: 8px;
  background: #eef2f7;
  color: #475569;
  font-size: calc(13px * var(--font-scale, 1));
  font-weight: 700;
  padding: 10px;
}

.explore-support-panel :deep(.state-tip--error) {
  background: #fef2f2;
  color: #991b1b;
}

.explore-support-panel :deep(.room-card) {
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  max-width: 100%;
  width: 100%;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
  margin-top: 14px;
  padding: 12px;
  text-align: left;
}

.explore-support-panel :deep(.room-card:hover),
.explore-support-panel :deep(.room-card:focus-visible) {
  border-color: #9ccaa9;
  box-shadow: 0 8px 20px rgba(22, 101, 52, 0.08);
  outline: none;
}

.explore-support-panel :deep(.room-card.active) {
  border-color: #ec4899;
  background: #fdf2f8;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2);
}

.explore-support-panel :deep(.support-card-left) {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: 14px;
  min-width: 0;
}

.explore-support-panel :deep(.support-icon) {
  align-items: center;
  background: #edf7ef;
  border: 1px solid #d1e3d5;
  border-radius: 8px;
  color: #166534;
  display: grid;
  flex: 0 0 auto;
  font-size: calc(22px * var(--font-scale, 1));
  font-weight: 900;
  height: 56px;
  place-items: center;
  width: 56px;
}

.explore-support-panel :deep(.support-main) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.explore-support-panel :deep(.support-category-tag) {
  background: #e8f5ea;
  border-radius: 8px;
  color: #166534;
  display: inline-block;
  font-size: calc(12px * var(--font-scale, 1));
  font-weight: 700;
  padding: 3px 9px;
  width: fit-content;
}

.explore-support-panel :deep(.room-card h3) {
  font-size: calc(15px * var(--font-scale, 1));
  line-height: 1.25;
  margin: 0;
}

.explore-support-panel :deep(.support-distance-text),
.explore-support-panel :deep(.support-origin-line) {
  color: #374151;
  font-size: calc(13px * var(--font-scale, 1));
  margin: 0;
}

.explore-support-panel :deep(.support-card-actions) {
  display: flex;
  flex-direction: column;
  flex: 0 0 96px;
  gap: 8px;
  min-width: 0;
}

.explore-support-panel :deep(.support-card-btn) {
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  font-size: calc(13px * var(--font-scale, 1));
  font-weight: 800;
  min-height: 34px;
  padding: 8px 11px;
  width: 100%;
}

.explore-support-panel :deep(.support-card-btn--secondary) {
  border: 1px solid #9ccaa9;
  background: #ffffff;
  color: #166534;
}

.explore-support-panel :deep(.support-card-btn--primary) {
  border: 1px solid #166534;
  background: #166534;
  color: #ffffff;
}

.support-detail-drawer {
  position: fixed;
  top: 60px;
  right: 0;
  bottom: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  width: min(460px, 100vw);
  border-left: 1px solid #dbe4df;
  background: #ffffff;
  box-shadow: -16px 0 40px rgba(15, 23, 42, 0.16);
}

.support-detail-header {
  border-bottom: 1px solid #e5e7eb;
  padding: 18px 20px 16px;
}

.support-detail-close {
  border: 1px solid #9ccaa9;
  border-radius: 8px;
  background: #ffffff;
  color: #166534;
  cursor: pointer;
  font-size: calc(12px * var(--font-scale, 1));
  font-weight: 800;
  min-height: 32px;
  padding: 7px 10px;
}

.support-detail-header span {
  display: block;
  margin-top: 14px;
  color: #166534;
  font-size: calc(12px * var(--font-scale, 1));
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.support-detail-header h2 {
  margin: 5px 0 0;
  color: #111827;
  font-size: calc(24px * var(--font-scale, 1));
  line-height: 1.18;
}

.support-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px;
}

.support-detail-section + .support-detail-section {
  margin-top: 22px;
}

.support-detail-section h3 {
  margin: 0 0 10px;
  color: #111827;
  font-size: calc(16px * var(--font-scale, 1));
}

.support-detail-list,
.support-hours-list {
  margin: 0;
}

.support-detail-list div,
.support-hours-list div {
  border-top: 1px solid #e5e7eb;
  padding: 10px 0;
}

.support-detail-list div:first-child,
.support-hours-list div:first-child {
  border-top: 0;
  padding-top: 0;
}

.support-detail-list dt,
.support-hours-list dt {
  color: #64748b;
  font-size: calc(12px * var(--font-scale, 1));
  font-weight: 800;
  margin-bottom: 4px;
}

.support-detail-list dd,
.support-hours-list dd {
  margin: 0;
  color: #1f2937;
  font-size: calc(14px * var(--font-scale, 1));
  line-height: 1.4;
}

.support-detail-list a {
  color: #166534;
  font-weight: 800;
  text-decoration: none;
}

.support-detail-list a:hover {
  text-decoration: underline;
}

.support-hours-list div {
  align-items: baseline;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
}

.support-detail-actions {
  border-top: 1px solid #e5e7eb;
  padding: 14px 20px 18px;
}

.support-detail-direction {
  width: 100%;
  border: 1px solid #166534;
  border-radius: 8px;
  background: #166534;
  color: #ffffff;
  cursor: pointer;
  font-size: calc(14px * var(--font-scale, 1));
  font-weight: 900;
  min-height: 42px;
  padding: 10px 12px;
}

.support-detail-enter-active,
.support-detail-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.support-detail-enter-from,
.support-detail-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (max-width: 900px) {
  .explore-support-panel :deep(.search-row) {
    flex-wrap: wrap;
    gap: 8px;
  }

  .explore-support-panel :deep(.search-input-shell) {
    flex-basis: 100%;
  }

  .explore-support-panel :deep(.search-input),
  .explore-support-panel :deep(.search-action-btn),
  .explore-support-panel :deep(.location-btn) {
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }

  .explore-support-panel :deep(.search-action-btn),
  .explore-support-panel :deep(.location-btn) {
    flex: 1;
    width: 100%;
  }

  .explore-support-panel :deep(.list-panel) {
    max-height: none;
  }

  .explore-support-panel :deep(.room-card) {
    flex-direction: column;
  }

  .explore-support-panel :deep(.support-card-actions) {
    flex: none;
    flex-direction: row;
    width: 100%;
  }

  .explore-support-panel :deep(.support-card-btn) {
    flex: 1;
  }

  .support-detail-drawer {
    top: 0;
    width: 100vw;
  }
}

@media (max-width: 640px) {
  .explore-support-panel {
    margin-top: 12px;
  }

  .explore-location-status {
    font-size: calc(12px * var(--font-scale, 1));
    padding: 8px 10px;
  }

  .explore-support-panel :deep(.room-card) {
    gap: 10px;
    padding: 11px;
  }

  .explore-support-panel :deep(.support-card-left) {
    align-items: flex-start;
    gap: 10px;
  }

  .explore-support-panel :deep(.support-icon) {
    height: 48px;
    width: 48px;
  }

  .explore-support-panel :deep(.support-card-actions) {
    gap: 8px;
  }

  .support-detail-header,
  .support-detail-body,
  .support-detail-actions {
    padding-left: 16px;
    padding-right: 16px;
  }

  .support-hours-list div {
    grid-template-columns: 82px minmax(0, 1fr);
  }
}
</style>
