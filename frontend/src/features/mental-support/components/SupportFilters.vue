<script setup>
import AddressSuggestionInput from '../../../shared/map/components/AddressSuggestionInput.vue'

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

function onInput() {
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
        <div class="search-input-shell">
          <AddressSuggestionInput
            :model-value="query"
            :suggestions="suggestions"
            :loading="loadingSuggestions"
            placeholder="Enter an address within City of Melbourne"
            @update:model-value="emit('update:query', $event)"
            @input="onInput"
            @select-suggestion="emit('select-suggestion', $event)"
            @submit="emit('apply-address-filter')"
          />
        </div>
        <button class="location-btn location-inline-btn" type="button" @click="$emit('use-my-location')">
          Use Current
        </button>
        <button
          class="search-action-btn"
          type="button"
          :disabled="applyingAddressFilter"
          @click="$emit('apply-address-filter')"
        >
          {{ applyingAddressFilter ? 'Searching...' : 'Search' }}
        </button>
      </div>
      <p v-if="addressFilterError" class="search-error">{{ addressFilterError }}</p>
    </div>
  </section>
</template>
