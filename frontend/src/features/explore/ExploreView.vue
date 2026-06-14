<script setup>
import './styles.css'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ExploreMap from './components/ExploreMap.vue'
import ExploreModeTabs from './components/ExploreModeTabs.vue'
import ExploreSidePanel from './components/ExploreSidePanel.vue'
import { EXPLORE_DEFAULT_MODE, EXPLORE_MODES } from './constants'
import { useExploreMap } from './composables/useExploreMap'

const activeModeId = ref(EXPLORE_DEFAULT_MODE)
const mapContainerRef = ref(null)
const mapError = ref('')

const activeMode = computed(
  () => EXPLORE_MODES.find((mode) => mode.id === activeModeId.value) || EXPLORE_MODES[0],
)

function setMapContainer(element) {
  mapContainerRef.value = element
}

const { cleanupMap, initExploreMap, mapReady, resetMapView, resizeMap } = useExploreMap({
  mapContainerRef,
})

onMounted(async () => {
  try {
    await nextTick()
    await initExploreMap()
  } catch (error) {
    console.error(error)
    mapError.value = error?.message || 'Failed to load map'
  }
})

onUnmounted(() => {
  cleanupMap()
})

watch(activeModeId, async () => {
  await nextTick()
  resizeMap()
  resetMapView()
})
</script>

<template>
  <main class="explore-page">
    <ExploreMap :active-mode="activeMode" :map-ready="mapReady" @map-ready="setMapContainer" />

    <section class="explore-workspace-panel">
      <header class="explore-panel-topbar">
        <router-link class="explore-home-link" to="/">Back Home</router-link>
      </header>

      <ExploreModeTabs v-model="activeModeId" :modes="EXPLORE_MODES" />
      <ExploreSidePanel :mode="activeMode" />
      <p v-if="mapError" class="explore-map-error">{{ mapError }}</p>
    </section>
  </main>
</template>
