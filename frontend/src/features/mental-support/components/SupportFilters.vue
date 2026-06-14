<script setup>
defineProps({
  addressFilterError: {
    type: String,
    default: '',
  },
  applyingAddressFilter: {
    type: Boolean,
    default: false,
  },
  loadingSuggestions: {
    type: Boolean,
    default: false,
  },
  query: {
    type: String,
    default: '',
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'apply-address-filter',
  'query-input',
  'select-suggestion',
  'update:query',
  'use-my-location',
])

function onInput(event) {
  emit('update:query', event.target.value)
  emit('query-input')
}
</script>

<template>
  <section class="top-bar">
    <router-link to="/" class="back-link-top" title="Back to Home">
      <span class="back-icon-top">←</span>
    </router-link>
    <div class="search-wrapper">
      <div class="search-row">
        <div class="support-search-field">
          <input
            :value="query"
            class="search-input"
            type="text"
            placeholder="Enter an address to find nearby counseling rooms"
            autocomplete="off"
            @input="onInput"
          />
          <div
            v-if="suggestions.length || loadingSuggestions"
            class="support-suggestion-menu"
            role="listbox"
          >
            <p v-if="loadingSuggestions" class="support-suggestion-status">
              Searching...
            </p>
            <button
              v-for="suggestion in suggestions"
              :key="`${suggestion.lat}-${suggestion.lng}-${suggestion.formattedAddress}`"
              class="support-suggestion-option"
              type="button"
              role="option"
              @click="emit('select-suggestion', suggestion)"
            >
              <span class="support-suggestion-name">
                {{ suggestion.name || suggestion.formattedAddress }}
              </span>
              <span
                v-if="suggestion.formattedAddress && suggestion.formattedAddress !== suggestion.name"
                class="support-suggestion-address"
              >
                {{ suggestion.formattedAddress }}
              </span>
            </button>
          </div>
        </div>
        <button
          class="search-action-btn"
          type="button"
          :disabled="applyingAddressFilter"
          @click="$emit('apply-address-filter')"
        >
          {{ applyingAddressFilter ? 'Filtering...' : 'Find a Place' }}
        </button>
      </div>
      <p v-if="addressFilterError" class="search-error">{{ addressFilterError }}</p>
    </div>
    <button class="location-btn" type="button" @click="$emit('use-my-location')">
      Use My Location
    </button>
  </section>
</template>

<style scoped>
.support-search-field {
  min-width: 0;
  position: relative;
}

.support-suggestion-menu {
  position: absolute;
  z-index: 1200;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  overflow: hidden;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.16);
}

.support-suggestion-status {
  margin: 0;
  padding: 10px 12px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.support-suggestion-option {
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #edf2f7;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
}

.support-suggestion-option:last-child {
  border-bottom: 0;
}

.support-suggestion-option:hover,
.support-suggestion-option:focus-visible {
  background: #ecfdf5;
  outline: none;
}

.support-suggestion-name,
.support-suggestion-address {
  display: block;
}

.support-suggestion-name {
  font-size: 14px;
  font-weight: 800;
}

.support-suggestion-address {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}
</style>
