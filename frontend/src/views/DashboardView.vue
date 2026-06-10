<template>
  <div class="dashboard">
    <div class="dashboard-inner">
      <header class="hero">
        <h1 class="hero-title">Community Health Insights</h1>
        <p class="hero-subtitle">
          Research-based information about social connection, mental health, and wellbeing among
          older Australians.
        </p>
      </header>

      <section class="section section--mental">
        <h2 class="section-title">This is a shared social issue</h2>
        <article class="card issue-card">
          <div class="issue-left">
            <div class="stat-box">
              <div class="stat-big">Almost 1 in 3</div>
              <div class="stat-small">Australians report moderate loneliness</div>
            </div>
            <div class="stat-box">
              <div class="stat-big">More than 1 in 6</div>
              <div class="stat-small">report severe loneliness</div>
            </div>
            <p class="source-text">Source: ELT 2023</p>
          </div>
          <div class="issue-right">
            <div class="ls-bar-wrap">
              <div
                class="ls-bar"
                role="img"
                aria-label="Loneliness distribution across Australians"
              >
                <div class="ls-seg ls-seg--severe" style="width: 17.5%">
                  <span class="ls-seg-pct">17.5%</span>
                </div>
                <div class="ls-seg ls-seg--moderate" style="width: 32%">
                  <span class="ls-seg-pct">32%</span>
                </div>
                <div class="ls-seg ls-seg--ok" style="width: 50.5%">
                  <span class="ls-seg-pct">~50%</span>
                </div>
              </div>
              <div class="ls-legend">
                <span class="ls-legend-item"
                  ><i class="ls-dot ls-dot--severe" />Severe loneliness</span
                >
                <span class="ls-legend-item"
                  ><i class="ls-dot ls-dot--moderate" />Moderate loneliness</span
                >
                <span class="ls-legend-item"><i class="ls-dot ls-dot--ok" />Not lonely</span>
              </div>
            </div>
            <p class="chart-note">
              Loneliness is commonly reported across the population and is not limited to a small
              group of individuals.
            </p>
          </div>
        </article>
      </section>

      <section class="section section--impact">
        <h2 class="section-title">Loneliness across different age groups</h2>
        <p class="section-subtitle">
          While loneliness is widely experienced, research shows that its prevalence varies across
          different age groups.
        </p>
        <article class="card age-card">
          <p class="source-text">Source: Ending Loneliness Together (2023)</p>
          <div class="v-chart-wrap">
            <div class="v-y-axis">
              <span>40%</span>
              <span>30%</span>
              <span>20%</span>
              <span>10%</span>
              <span>0%</span>
            </div>

            <div class="v-chart-panel">
              <div class="v-chart">
                <div class="v-grid-line" />
                <div class="v-grid-line" />
                <div class="v-grid-line" />
                <div class="v-grid-line" />
                <div class="v-grid-line" />

                <div
                  v-for="(item, index) in ageGroupBars"
                  :key="item.age"
                  class="v-col"
                  :class="{ 'is-active': hoveredAgeIndex === index }"
                  @mouseenter="onAgeBarEnter(index)"
                  @mouseleave="onAgeBarLeave"
                >
                  <div class="v-track">
                    <div class="v-bar" :style="{ height: `${(item.value / 40) * 100}%` }">
                      <span class="v-bar-value">{{ item.value }}%</span>
                    </div>
                  </div>

                  <div v-if="hoveredAgeIndex === index" class="v-inline-tooltip">
                    <p class="v-tooltip-title">{{ item.age }}</p>
                    <p class="v-tooltip-line">
                      <span class="v-tooltip-dot" />
                      <span>Loneliness</span>
                      <strong>{{ item.value }}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div class="v-x-axis">
                <span v-for="item in ageGroupBars" :key="`age-${item.age}`" class="v-age">
                  {{ item.age }}
                </span>
              </div>
            </div>
          </div>
          <p class="chart-note">
            Higher levels are reported among younger adults, but loneliness is present across all
            stages of life.
          </p>
          <p class="chart-note">
            Although reported levels are lower in older age groups, loneliness remains a relevant
            issue due to its impact on health and wellbeing.
          </p>
        </article>
      </section>

      <section class="section">
        <h2 class="section-title">Mental health and wellbeing context</h2>
        <p class="section-subtitle">
          This section looks beyond loneliness rates to show how mental health and local wellbeing
          relate to social connection in later life.
        </p>
        <article class="card local-wellbeing-card">
          <h3 class="card-title">Local wellbeing indicators for Melbourne residents aged 65+</h3>
          <div class="wellbeing-indicators">
            <div class="indicator-box">
              <p class="indicator-value">72.4%</p>
              <p class="indicator-label">Self-reported mental health rated excellent/very good</p>
            </div>
            <div class="indicator-box">
              <p class="indicator-value">73.0 / 100</p>
              <p class="indicator-label">Satisfaction with feeling part of the community</p>
            </div>
          </div>
          <p class="chart-note">
            These local indicators describe self-reported wellbeing and community belonging among
            Melbourne residents aged 65+.
          </p>
          <p class="source-text">
            Source: City of Melbourne, Social Indicators for City of Melbourne Residents 2023
          </p>
        </article>
      </section>

      <section class="section">
        <h2 class="section-title">Long-term loneliness affects more than mood</h2>
        <div class="impact-grid">
          <article v-for="item in impactCards" :key="item.title" class="card impact-card">
            <div class="impact-icon-wrap" aria-hidden="true">
              <span class="impact-icon" :class="`impact-icon--${item.icon}`">
                {{ item.iconSymbol }}
              </span>
            </div>
            <p class="impact-value">{{ item.value }}</p>
            <h3 class="impact-title">{{ item.title }}</h3>
            <p class="impact-desc">{{ item.desc }}</p>
            <p class="source-text">Source: ELT Report</p>
          </article>
        </div>

        <article class="card isolation-layout">
          <h3 class="isolation-title">The Weight of Isolation</h3>
          <p class="isolation-intro">
            According to extensive meta-analyses led by Dr. Julianne Holt-Lunstad, chronic
            loneliness increases the risk of premature death significantly. The biological toll on
            the human body is staggering, equivalent to well-known health hazards.
          </p>
          <div class="isolation-fact-list">
            <div class="isolation-fact-item">
              <span class="fact-icon fact-icon--warning" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="fact-icon-svg">
                  <path d="M12 2.5L22 20.5H2L12 2.5Z" fill="currentColor" />
                  <rect x="11" y="8" width="2" height="7" fill="#ffffff" />
                  <rect x="11" y="16.5" width="2" height="2" fill="#ffffff" />
                </svg>
              </span>
              <div>
                <h4>Equivalent to 15 Cigarettes</h4>
                <p>The mortality impact mirrors smoking 15 cigarettes daily.</p>
              </div>
            </div>
            <div class="isolation-fact-item">
              <span class="fact-icon fact-icon--health" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="fact-icon-svg">
                  <rect x="1.5" y="2.5" width="21" height="19" rx="3.4" fill="currentColor" />
                  <path
                    d="M4.3 12.2H8.1L10.1 8L12.8 15.3L14.9 11.2H19.8"
                    stroke="#ffffff"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
              <div>
                <h4>Worse than Obesity</h4>
                <p>Isolation poses a higher risk than physical inactivity and obesity.</p>
              </div>
            </div>
          </div>
        </article>

        <article class="card community-cta-card">
          <p class="community-cta-highlight">
            Small community interactions can help rebuild resilience.
          </p>
          <button class="community-cta-button" type="button" @click="goToEventPage">
            Explore nearby low-pressure activities
          </button>
          <p class="community-cta-desc">
            Gentle community contact can strengthen connection, confidence, and belonging.
          </p>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const ageGroupBars = [
  { age: '45-54', value: 36 },
  { age: '55-64', value: 34 },
  { age: '65-74', value: 26 },
  { age: '75+', value: 13 },
]

const impactCards = [
  {
    icon: 'depression',
    iconSymbol: '💔',
    value: '4.6x',
    title: 'Depression',
    desc: 'Moderate loneliness was associated with substantially higher odds of depression in national survey data.',
  },
  {
    icon: 'anxiety',
    iconSymbol: '👥',
    value: '4.1x',
    title: 'Social Anxiety',
    desc: 'Higher loneliness levels were associated with greater likelihood of social anxiety.',
  },
  {
    icon: 'wellbeing',
    iconSymbol: '☹',
    value: '5.2x',
    title: 'Poor Wellbeing',
    desc: 'People reporting loneliness were more likely to report poorer wellbeing and lower quality of life.',
  },
]

const hoveredAgeIndex = ref(null)
const onAgeBarEnter = (index) => {
  hoveredAgeIndex.value = index
}
const onAgeBarLeave = () => {
  hoveredAgeIndex.value = null
}

const goToEventPage = () => {
  router.push({ name: 'discover-nearby-places' })
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.dashboard {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-soft: #eef6f0;
  --line: #d8e8dd;
  --text-main: #24363a;
  --text-muted: #5e7276;
  --green-strong: #2e7a58;
  --green-mid: #4f9c77;
  --green-light: #cfe9d7;
  --blue-bar: #3f78ab;
  --blue-bar-dark: #2f6493;
  --male: #2f7f68;
  --female: #6a8f4f;
  --kpi-bg: #e4f3e8;
  --warning-bg: #fff4dc;

  background: var(--bg);
  min-height: calc(100vh - 60px);
  padding: 34px 20px 56px;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
}

.dashboard-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 30px;
}

.hero-title {
  margin: 0 0 10px;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 800;
  color: var(--green-strong);
}

.hero-subtitle {
  margin: 0 auto;
  max-width: 980px;
  color: var(--text-muted);
  line-height: 1.6;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .hero-subtitle {
    max-width: 700px;
    white-space: normal;
  }
}

.section {
  margin-top: 34px;
}

.section-title {
  margin: 0;
  font-size: clamp(1.55rem, 2.2vw, 2rem);
  font-weight: 700;
}

.section-subtitle {
  margin: 10px 0 16px;
  color: var(--text-muted);
  line-height: 1.65;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(32, 57, 43, 0.08);
}

.issue-card {
  margin-top: 14px;
  padding: 24px;
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}

.issue-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stat-box {
  background: #e8f0ec;
  border-radius: 10px;
  padding: 20px 18px;
  text-align: center;
}

.stat-big {
  font-size: clamp(1.7rem, 2vw, 2.2rem);
  font-weight: 800;
  color: #2f6f7f;
}

.stat-small {
  margin-top: 6px;
  color: #516972;
}

.donut-chart {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 8px;
}

.donut-item {
  flex: 1;
  min-width: 180px;
  display: flex;
  justify-content: center;
}

.donut-svg-wrap {
  position: relative;
  width: 160px;
  height: 160px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-track,
.donut-value {
  fill: none;
  stroke-width: 16;
}

.donut-track {
  stroke: #dde9e1;
}

.donut-value {
  stroke: #3f78ab;
  stroke-linecap: round;
}

.donut-center {
  position: absolute;
  inset: 24px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  padding: 0 8px;
}

.donut-percent {
  font-size: 1.4rem;
  font-weight: 800;
  color: #2f6f7f;
}

.donut-label {
  margin-top: 4px;
  font-size: 0.78rem;
  color: #5d7174;
  line-height: 1.25;
}

.age-card {
  margin-top: 16px;
  padding: 18px 18px 14px;
}

.v-chart-wrap {
  margin: 18px auto 0;
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 6px;
  align-items: start;
  max-width: 824px;
}

.v-y-axis {
  position: relative;
  height: 252px;
  color: #6f7f83;
  font-size: 0.92rem;
}

.v-y-axis span {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  line-height: 1;
}

.v-y-axis span:nth-child(1) {
  top: 0%;
  transform: translateY(0);
}
.v-y-axis span:nth-child(2) {
  top: 25%;
}
.v-y-axis span:nth-child(3) {
  top: 50%;
}
.v-y-axis span:nth-child(4) {
  top: 75%;
}
.v-y-axis span:nth-child(5) {
  top: 100%;
  transform: translateY(-100%);
}

.v-chart-panel {
  display: flex;
  flex-direction: column;
  max-width: 760px;
  margin: 0;
  width: 100%;
}

.v-chart {
  height: 252px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(92px, 1fr));
  align-items: end;
  gap: 8px;
  padding: 0;
  border-bottom: 1px solid #c9d2cc;
}

.v-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid #e3e8e5;
  z-index: 0;
}

.v-grid-line:nth-child(1) {
  top: 0%;
}
.v-grid-line:nth-child(2) {
  top: 25%;
}
.v-grid-line:nth-child(3) {
  top: 50%;
}
.v-grid-line:nth-child(4) {
  top: 75%;
}
.v-grid-line:nth-child(5) {
  top: 100%;
}

.v-col {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.v-col::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -8px;
  right: -8px;
  border-radius: 2px;
  background: transparent;
  transition: background-color 0.15s ease;
  z-index: 0;
}

.v-col.is-active::before {
  background: #eef1f5;
}

.v-track {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
  z-index: 1;
}

.v-bar {
  width: 92px;
  max-width: 100%;
  min-height: 8px;
  border-radius: 5px 5px 0 0;
  background: linear-gradient(180deg, #5dae83, var(--green-strong));
  position: relative;
  cursor: default;
  z-index: 2;
}

.v-bar-value {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #f4fbff;
  font-size: 0.95rem;
  font-weight: 700;
}

.v-x-axis {
  display: grid;
  grid-template-columns: repeat(4, minmax(92px, 1fr));
  gap: 8px;
  padding: 8px 0 0;
}

.v-age {
  text-align: center;
  font-size: 1rem;
  color: #61727c;
}

.v-inline-tooltip {
  position: absolute;
  left: 50%;
  top: 53%;
  transform: translate(-30%, -50%);
  background: #ffffff;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  box-shadow: 0 3px 8px rgba(34, 50, 63, 0.18);
  padding: 8px 10px;
  min-width: 132px;
  z-index: 4;
  pointer-events: none;
}

.v-tooltip-title {
  margin: 0;
  font-size: 0.85rem;
  color: #525f6c;
}

.v-tooltip-line {
  margin: 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3e4f60;
  font-size: 0.95rem;
}

.v-tooltip-line strong {
  margin-left: auto;
  font-size: 1.2rem;
  line-height: 1;
}

.v-tooltip-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--green-strong);
}

.card-title {
  margin: 0 0 12px;
  line-height: 1.35;
  font-size: 1.85rem;
  font-weight: 700;
}

.local-wellbeing-card {
  padding: 20px;
}

.local-wellbeing-card .card-title {
  font-size: 1.05rem;
  line-height: 1.35;
  margin-bottom: 10px;
}

.wellbeing-indicators {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.mini-title {
  margin: 34px 0 0;
  font-size: 0.95rem;
  color: #31484f;
}

.indicator-box {
  background: var(--kpi-bg);
  border: 1px solid #d2e9d9;
  border-radius: 10px;
  padding: 20px 18px;
  margin-top: 14px;
  text-align: center;
}

.indicator-value {
  margin: 0;
  font-size: clamp(2rem, 3.4vw, 3rem);
  line-height: 1.1;
  font-weight: 800;
  color: #1d8c54;
}

.indicator-label {
  margin: 8px 0 0;
  color: #4d6468;
  line-height: 1.7;
}

.local-wellbeing-card .chart-note {
  margin-top: 22px;
  line-height: 1.9;
}

.local-wellbeing-card .source-text {
  margin-top: 16px;
  line-height: 1.75;
}

.local-wellbeing-card {
  display: flex;
  flex-direction: column;
}

.local-wellbeing-card .card-title {
  line-height: 1.5;
  margin-bottom: 14px;
}

.local-wellbeing-card .indicator-box {
  margin-top: 18px;
}

.local-wellbeing-card .indicator-label {
  line-height: 1.9;
}

.local-wellbeing-card .source-text {
  margin-top: 14px;
  padding-top: 0;
}

.section--impact {
  margin-top: 56px;
}

.impact-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.impact-card {
  text-align: center;
  padding: 20px;
}

.impact-icon-wrap {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
}

.impact-icon {
  font-size: 1.55rem;
  line-height: 1;
}

.impact-icon--depression {
  color: #2f7f95;
}

.impact-icon--anxiety {
  color: #5b3a90;
}

.impact-icon--wellbeing {
  color: #5f8d96;
}

.impact-value {
  margin: 10px 0 2px;
  font-size: 2.25rem;
  font-weight: 800;
  color: #2d6f85;
}

.impact-title {
  margin: 0;
  font-size: 1.25rem;
}

.impact-desc {
  margin: 10px 0 12px;
  color: #5f7275;
  line-height: 1.55;
}

.isolation-layout {
  margin-top: 14px;
  padding: 32px 36px;
}

.community-cta-card {
  margin-top: 14px;
  padding: 30px 24px 28px;
  display: grid;
  justify-items: center;
  gap: 38px;
  text-align: center;
  border: 0;
  box-shadow: none;
  background: #ffffff;
}

.community-cta-highlight {
  margin: 0;
  width: auto;
  max-width: 100%;
  display: inline-block;
  border-radius: 12px;
  background: #e8f4ec;
  padding: 16px 24px;
  color: #3f7c5f;
  font-size: 2.16rem;
  font-weight: 600;
  line-height: 2;
  text-align: center;
}

.community-cta-button {
  border: 0;
  border-radius: 999px;
  padding: 14px 24px;
  min-width: min(100%, 420px);
  background: #76b792;
  color: #ffffff;
  font-family: inherit;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.35;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(22, 52, 68, 0.2);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.community-cta-button:hover {
  background: #66ac85;
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(22, 52, 68, 0.24);
}

.community-cta-button:focus-visible {
  outline: 3px solid #8bb4ca;
  outline-offset: 2px;
}

.community-cta-desc {
  margin: 0;
  max-width: 760px;
  color: #101827;
  font-size: 0.92rem;
  line-height: 2.15;
}

.isolation-title {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.25;
  color: #101827;
}

.isolation-intro {
  margin: 14px 0 0;
  max-width: none;
  color: #475467;
  font-size: 0.95rem;
  line-height: 1.65;
}

.isolation-fact-list {
  margin-top: 26px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.isolation-fact-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.fact-icon {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
}

.fact-icon-svg {
  width: 100%;
  height: 100%;
}

.fact-icon--warning {
  color: #f97316;
}

.fact-icon--health {
  color: #166534;
}

.isolation-fact-item h4 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #101827;
}

.isolation-fact-item p {
  margin: 8px 0 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: #475467;
}

/* --- Stacked loneliness bar --- */
.ls-bar-wrap {
  margin-top: 16px;
}

.ls-bar {
  display: flex;
  height: 54px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

.ls-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s ease;
  cursor: default;
  min-width: 0;
}

.ls-seg:hover {
  filter: brightness(0.93);
}

.ls-seg--severe {
  background: #166534;
}

.ls-seg--moderate {
  background: #22c55e;
}

.ls-seg--ok {
  background: #dcfce7;
}

.ls-seg-pct {
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.ls-seg--ok .ls-seg-pct {
  color: #166534;
}

.ls-legend {
  display: flex;
  gap: 18px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.ls-legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.ls-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  flex-shrink: 0;
}

.ls-dot--severe {
  background: #166534;
}
.ls-dot--moderate {
  background: #22c55e;
}
.ls-dot--ok {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.source-text {
  margin: 10px 0 0;
  font-size: 0.82rem;
  color: #7a8d91;
}

.chart-note {
  margin: 12px 0 0;
  line-height: 1.62;
  color: #5f7275;
}

.chart-tooltip {
  position: fixed;
  z-index: 50;
  pointer-events: none;
  background: rgba(34, 51, 44, 0.94);
  color: #f4faf6;
  border: 1px solid rgba(207, 233, 215, 0.5);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
}

@media (min-width: 900px) {
  .issue-card {
    grid-template-columns: 1.2fr 1fr;
    align-items: stretch;
  }

  .wellbeing-indicators {
    grid-template-columns: 1fr 1fr;
  }

  .impact-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .v-chart-wrap {
    margin: 14px 0 0;
    max-width: none;
    grid-template-columns: 44px 1fr;
    gap: 6px;
  }

  .v-y-axis {
    height: 214px;
    font-size: 0.78rem;
  }

  .v-chart {
    grid-template-columns: repeat(4, minmax(42px, 1fr));
    gap: 10px;
    padding: 0;
    height: 214px;
  }

  .v-x-axis {
    grid-template-columns: repeat(4, minmax(42px, 1fr));
    gap: 10px;
    padding-right: 0;
  }

  .v-bar {
    width: 100%;
  }

  .v-age {
    font-size: 0.82rem;
  }

  .donut-item {
    min-width: 100%;
  }

  .isolation-layout {
    padding: 20px;
  }

  .isolation-fact-list {
    grid-template-columns: 1fr;
  }

  .wellbeing-indicators {
    grid-template-columns: 1fr;
  }

  .community-cta-card {
    padding: 20px 14px 18px;
    gap: 26px;
  }

  .community-cta-highlight {
    font-size: 1.5rem;
    line-height: 1.95;
    padding: 14px 16px;
  }

  .community-cta-button {
    width: 100%;
    min-width: 0;
    padding: 12px 12px;
    font-size: 0.96rem;
  }

  .community-cta-desc {
    margin-top: 0;
    font-size: 0.88rem;
    line-height: 2.05;
  }

  .isolation-title {
    font-size: 1.55rem;
  }

  .isolation-intro {
    font-size: 0.92rem;
    margin-top: 14px;
  }

  .isolation-fact-item h4 {
    font-size: 1.25rem;
  }

  .isolation-fact-item p {
    font-size: 0.9rem;
  }
}
</style>
