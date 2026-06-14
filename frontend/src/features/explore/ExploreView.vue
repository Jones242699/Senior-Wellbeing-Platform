<script setup>
import './styles.css'
import ExploreModeTabs from './components/ExploreModeTabs.vue'
import { EXPLORE_MODES } from './constants'
</script>

<template>
  <main class="explore-page">
    <section class="explore-shell">
      <header class="explore-header">
        <div>
          <p class="explore-kicker">Explore Melbourne</p>
          <h1>Choose a local wellbeing tool</h1>
        </div>
        <router-link class="explore-home-link" to="/">Back Home</router-link>
      </header>

      <ExploreModeTabs :modes="EXPLORE_MODES" />

      <section class="explore-overview" aria-label="Explore tool summary">
        <article v-for="mode in EXPLORE_MODES" :key="mode.id" class="explore-summary">
          <div :class="['explore-summary-mark', `explore-summary-mark--${mode.tone}`]"></div>
          <div>
            <h2>{{ mode.title }}</h2>
            <ul>
              <li v-for="item in mode.stats" :key="item">{{ item }}</li>
            </ul>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
