<script setup>
import { ref } from 'vue'
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
  'destination-submit',
  'generate-route',
  'select-destination-suggestion',
  'select-start-suggestion',
  'start-input',
  'start-submit',
  'travel-mode-change',
  'update:destination',
  'update:start-location',
  'use-my-location',
])

const destinationInputRef = ref(null)

function onStartInput() {
  emit('start-input')
}

function onDestInput() {
  emit('dest-input')
}

function onStartSubmit() {
  emit('start-submit')
  destinationInputRef.value?.focus()
}

function onDestinationSubmit() {
  emit('destination-submit')
}
</script>

<template>
  <div class="form-group">
    <label class="form-label label-green">A Start</label>
    <div class="input-row">
      <div class="input-icon-wrapper input-shell-with-status">
        <AddressSuggestionInput
          :model-value="startLocation"
          :suggestions="startSuggestions"
          :loading="loadingStartSuggestions"
          placeholder="Start address in City of Melbourne"
          @update:model-value="emit('update:start-location', $event)"
          @input="onStartInput"
          @select-suggestion="emit('select-start-suggestion', $event)"
          @submit="onStartSubmit"
        />
      </div>
      <button
        type="button"
        class="btn-sm btn-location-inline"
        @click="$emit('use-my-location')"
      >
        Use Current
      </button>
    </div>
  </div>

  <div class="form-group">
    <label class="form-label label-green">B Destination</label>
    <div class="input-row">
      <div class="input-icon-wrapper">
        <AddressSuggestionInput
          ref="destinationInputRef"
          :model-value="destination"
          :suggestions="destinationSuggestions"
          :loading="loadingDestinationSuggestions"
          placeholder="Destination in City of Melbourne"
          @update:model-value="emit('update:destination', $event)"
          @input="onDestInput"
          @select-suggestion="emit('select-destination-suggestion', $event)"
          @submit="onDestinationSubmit"
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
