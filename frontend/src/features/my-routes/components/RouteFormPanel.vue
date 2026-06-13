<script setup>
defineProps({
  destination: { type: String, required: true },
  routing: { type: Boolean, required: true },
  startLocation: { type: String, required: true },
  travelMode: { type: String, default: null },
  travelModes: { type: Array, required: true },
})

const emit = defineEmits([
  'dest-input',
  'dest-input-ready',
  'start-input',
  'start-input-ready',
  'travel-mode-change',
  'update:destination',
  'update:start-location',
  'use-my-location',
])

function onStartInput(event) {
  emit('update:start-location', event.target.value)
  emit('start-input')
}

function onDestInput(event) {
  emit('update:destination', event.target.value)
  emit('dest-input')
}
</script>

<template>
  <div class="form-group">
    <label class="form-label label-green">A Start</label>
    <div class="input-row">
      <div class="input-icon-wrapper">
        <span class="icon-magnify" aria-hidden="true">🔍</span>
        <input
          :ref="(el) => $emit('start-input-ready', el)"
          :value="startLocation"
          type="text"
          placeholder="Where do you start from?"
          autocomplete="off"
          @input="onStartInput"
        />
      </div>
      <button type="button" class="btn-sm btn-green" @click="$emit('use-my-location')">
        Use My Location
      </button>
    </div>
  </div>

  <div class="form-group">
    <label class="form-label label-green">B Destination</label>
    <div class="input-row">
      <div class="input-icon-wrapper">
        <span class="icon-magnify" aria-hidden="true">🔍</span>
        <input
          :ref="(el) => $emit('dest-input-ready', el)"
          :value="destination"
          type="text"
          placeholder="Where do you want to go?"
          autocomplete="off"
          @input="onDestInput"
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
  </div>
</template>
