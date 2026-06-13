<script setup>
defineProps({
  ideasStep: { type: Number, required: true },
  ideasTransportMode: { type: String, required: true },
  ideasCategoryAnswers: { type: Array, required: true },
  choices: { type: Array, required: true },
})

defineEmits([
  'close',
  'go-to-step',
  'update:ideas-transport-mode',
  'toggle-category',
  'apply',
])
</script>

<template>
  <div class="ideas-overlay" @click="$emit('close')">
    <section
      class="ideas-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Trip ideas survey"
      @click.stop
    >
      <header class="ideas-header">
        <h2>Quick ideas survey</h2>
        <button type="button" class="ideas-close-btn" @click="$emit('close')">Close</button>
      </header>

      <Transition name="ideas-step" mode="out-in">
        <div v-if="ideasStep === 1" :key="'step-1'" class="ideas-body">
          <p class="ideas-question">Do you prefer driving or walking?</p>
          <div class="ideas-option-group">
            <button
              type="button"
              class="ideas-option-btn"
              :class="{ selected: ideasTransportMode === 'walking' }"
              @click="$emit('update:ideas-transport-mode', 'walking')"
            >
              Walking
            </button>
            <button
              type="button"
              class="ideas-option-btn"
              :class="{ selected: ideasTransportMode === 'driving' }"
              @click="$emit('update:ideas-transport-mode', 'driving')"
            >
              Driving
            </button>
          </div>
          <div class="ideas-actions">
            <button
              type="button"
              class="ideas-next-btn"
              :disabled="!ideasTransportMode"
              @click="$emit('go-to-step', 2)"
            >
              Next
            </button>
          </div>
        </div>

        <div v-else :key="'step-2'" class="ideas-body">
          <p class="ideas-question">
            What kind of places would you enjoy exploring right now? (Multi-select)
          </p>
          <div class="ideas-option-group column">
            <button
              v-for="choice in choices"
              :key="choice.key"
              type="button"
              class="ideas-option-btn text-left"
              :class="{ selected: ideasCategoryAnswers.includes(choice.key) }"
              @click="$emit('toggle-category', choice.key)"
            >
              {{ choice.label }}
            </button>
          </div>
          <div class="ideas-actions split">
            <button type="button" class="ideas-secondary-btn" @click="$emit('go-to-step', 1)">
              Back
            </button>
            <button
              type="button"
              class="ideas-next-btn"
              :disabled="!ideasCategoryAnswers.length"
              @click="$emit('apply')"
            >
              Apply
            </button>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>
