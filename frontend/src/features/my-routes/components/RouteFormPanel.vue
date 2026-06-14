<script setup>
import AddressSuggestionInput from '../../../shared/map/components/AddressSuggestionInput.vue'

defineProps({
  destination: { type: String, required: true },
  destinationSuggestions: { type: Array, default: () => [] },
  loadingDestinationSuggestions: { type: Boolean, default: false },
  loadingStartSuggestions: { type: Boolean, default: false },
  routing: { type: Boolean, required: true },
  startLocation: { type: String, required: true },
  startSuggestions: { type: Array, default: () => [] },
  travelMode: { type: String, default: null },
  travelModes: { type: Array, required: true },
})

const emit = defineEmits([
  'dest-input',
  'generate-route',
  'select-destination-suggestion',
  'select-start-suggestion',
  'start-input',
  'travel-mode-change',
  'update:destination',
  'update:start-location',
  'use-my-location',
])

function onStartInput() {
  emit('start-input')
}

function onDestInput() {
  emit('dest-input')
}
</script>

<template>
  <div class="form-group">
    <div class="form-label-row">
      <label class="form-label label-green">A Start</label>
      <button
        type="button"
        class="btn-sm btn-location-inline"
        @click="$emit('use-my-location')"
      >
        Use My Location
      </button>
    </div>
    <div class="input-row">
      <div class="input-icon-wrapper">
        <AddressSuggestionInput
          :model-value="startLocation"
          :suggestions="startSuggestions"
          :loading="loadingStartSuggestions"
          placeholder="Where do you start from?"
          @update:model-value="emit('update:start-location', $event)"
          @input="onStartInput"
          @select-suggestion="emit('select-start-suggestion', $event)"
        />
      </div>
    </div>
  </div>

  <div class="form-group">
    <label class="form-label label-green">B Destination</label>
    <div class="input-row">
      <div class="input-icon-wrapper">
        <AddressSuggestionInput
          :model-value="destination"
          :suggestions="destinationSuggestions"
          :loading="loadingDestinationSuggestions"
          placeholder="Where do you want to go?"
          @update:model-value="emit('update:destination', $event)"
          @input="onDestInput"
          @select-suggestion="emit('select-destination-suggestion', $event)"
        />
      </div>
    </div>
  </div>

  <div class="form-group">
    <span class="form-label label-mode">Travel Mode</span>
    <div class="mode-toolbar">
      <div class="mode-row">
        <button
          v-for="m in travelModes"
          :key="m.id"
          type="button"
          :class="['mode-chip', { active: travelMode === m.id }]"
          @click="$emit('travel-mode-change', m.id)"
        >
          {{ m.label }}
        </button>
      </div>
      <span v-show="routing" class="mode-spinner" aria-hidden="true" title="Updating route" />
    </div>
    <button
      type="button"
      class="btn-generate route-plan-button"
      :disabled="routing"
      @click="$emit('generate-route')"
    >
      {{ routing ? 'Planning...' : 'Plan My Route' }}
    </button>
  </div>
</template>
