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
  query: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'apply-address-filter',
  'query-input',
  'query-input-ready',
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
        <input
          :ref="(el) => emit('query-input-ready', el)"
          :value="query"
          class="search-input"
          type="text"
          placeholder="Enter an address to find nearby counseling rooms"
          @input="onInput"
        />
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
