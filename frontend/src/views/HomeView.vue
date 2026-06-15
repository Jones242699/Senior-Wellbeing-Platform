<script setup>
import cardPlaces from '../assets/card-places.png'
import cardRoutes from '../assets/card-routes.png'
import cardSupport from '../assets/card-support.png'
import communityPathPin from '../assets/community-path-pin.png'
import connectWellLogo from '../assets/ConnectWell.png'
import featureConnectionWellbeing from '../assets/feature-strip/connection-wellbeing.png'
import featureGreenShade from '../assets/feature-strip/green-shade.png'
import featureJourneyRoute from '../assets/feature-strip/journey-route.png'
import featureLocalCommunity from '../assets/feature-strip/local-community.png'
import featurePeopleFlow from '../assets/feature-strip/people-flow.png'
import homeHero from '../assets/home-hero.png'
import insightPeopleFlow from '../assets/insight-people-flow.png'
import insightServices from '../assets/insight-services.png'
import insightShade from '../assets/insight-shade.png'

const featureItems = [
  {
    image: featureGreenShade,
    title: 'Green & Shade',
    text: 'Comfortable, cooler journeys',
  },
  {
    image: featureJourneyRoute,
    title: 'Journey & Route',
    text: 'Safe, accessible, well-planned routes',
  },
  {
    image: featurePeopleFlow,
    title: 'People Flow',
    text: 'Live data for safer, more confident walks',
  },
  {
    image: featureLocalCommunity,
    title: 'Local & Community',
    text: 'Discover nearby services, activities and support',
  },
  {
    image: featureConnectionWellbeing,
    title: 'Connection & Wellbeing',
    text: 'Building connections, enhancing wellbeing',
  },
]

const insightCards = [
  {
    image: insightPeopleFlow,
    title: 'People Flow',
    desc: 'Active community movement',
    metric: '7,842',
    text: 'people today',
    chart: 'blue',
  },
  {
    image: insightShade,
    title: 'Shaded Walking Areas',
    desc: 'Comfortable walking opportunities',
    metric: '68%',
    text: 'of routes',
    chart: 'green',
  },
  {
    image: insightServices,
    title: 'Nearby Services',
    desc: 'Support services within easy reach',
    metric: '128',
    text: 'services found',
    chart: 'purple',
  },
]
</script>

<template>
  <main class="home-page">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="welcome-pill">Welcome to ConnectWell</p>
        <h1>
          <span class="title-line">Find Connection,</span>
          <span class="title-line"><strong>One Journey</strong> at a Time</span>
        </h1>
        <p class="hero-description">
          Explore nearby places, navigate comfortable routes, and access community support all in
          one place.
        </p>
        <div class="hero-actions">
          <router-link to="/explore?mode=places" class="btn btn-primary">
            <svg
              aria-hidden="true"
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Explore Nearby
          </router-link>
          <router-link to="/insights" class="btn btn-secondary">
            <svg
              aria-hidden="true"
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 19V5" />
              <path d="M20 19H4" />
              <rect x="7" y="11" width="3" height="5" rx="1" />
              <rect x="12" y="8" width="3" height="8" rx="1" />
              <rect x="17" y="4" width="3" height="12" rx="1" />
            </svg>
            See Community Insights
          </router-link>
        </div>
        <div class="confidence-row">
          <div class="avatar-stack" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Supporting older adults to stay active, connected and confident.</p>
        </div>
      </div>

      <div class="hero-art-wrap">
        <img :src="homeHero" alt="Illustration of a park pathway and community connection" />
      </div>
    </section>

    <section class="feature-strip" aria-label="ConnectWell features">
      <h2>Everything you need to explore and connect</h2>
      <div class="feature-grid">
        <article v-for="item in featureItems" :key="item.title" class="feature-item">
          <img :src="item.image" :alt="`${item.title} icon`" />
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section class="journey-section">
      <div class="section-heading">
        <h2>What would you like to explore today?</h2>
        <p>Choose a way to get started. You can always explore more later.</p>
      </div>

      <div class="journey-grid">
        <article class="journey-card journey-card--places">
          <img :src="cardPlaces" alt="Community places illustration" />
          <h3>Explore Nearby Places</h3>
          <p>Discover cafés, parks, libraries and local activities around you.</p>
          <div class="stacked-actions">
            <router-link to="/explore?mode=places" class="card-btn card-btn--green">
              Explore Places
            </router-link>
            <router-link to="/nearby-events" class="card-btn card-btn--outline">
              Explore Events
            </router-link>
          </div>
        </article>

        <article class="journey-card journey-card--routes">
          <img :src="cardRoutes" alt="Comfortable route illustration" />
          <h3>Plan a Comfortable Journey</h3>
          <p>Find routes with shade, activity and nearby facilities to support confident walking.</p>
          <router-link to="/explore?mode=routes" class="card-btn card-btn--blue">
            Start Route Planning
          </router-link>
        </article>

        <article class="journey-card journey-card--support">
          <img :src="cardSupport" alt="Community support illustration" />
          <h3>Find Community Support</h3>
          <p>Access nearby wellbeing, counselling and support services.</p>
          <router-link to="/explore?mode=support" class="card-btn card-btn--purple">
            View Support Services
          </router-link>
        </article>
      </div>
    </section>

    <section class="insights-preview">
      <div class="insights-copy">
        <p class="eyebrow">Community insights</p>
        <h2>Understanding Your Community</h2>
        <p>
          See how local activity, accessibility and community participation contribute to healthy
          ageing.
        </p>
        <router-link to="/insights" class="btn btn-insight">
          <span aria-hidden="true">▥</span>
          Explore Insights
        </router-link>
      </div>

      <div class="insight-card-grid">
        <article v-for="item in insightCards" :key="item.title" class="insight-card">
          <img :src="item.image" :alt="`${item.title} illustration`" />
          <h3>{{ item.title }}</h3>
          <p class="insight-card-desc">{{ item.desc }}</p>
          <strong>{{ item.metric }}</strong>
          <p>{{ item.text }}</p>
          <div :class="['mini-chart', `mini-chart--${item.chart}`]" aria-hidden="true">
            <span></span>
          </div>
        </article>
      </div>
      <p class="insight-note">
        <span aria-hidden="true">i</span>
        Insights are updated daily to help you make informed choices.
      </p>
    </section>

    <section class="community-cta">
      <img :src="communityPathPin" alt="" aria-hidden="true" />
      <div>
        <h2>Together, we can build a more connected community.</h2>
        <p>Every journey you take is a step towards connection.</p>
      </div>
      <router-link to="/explore?mode=places">Learn More About ConnectWell</router-link>
    </section>

    <footer class="home-footer">
      <div class="footer-brand">
        <img :src="connectWellLogo" alt="ConnectWell logo" />
        <span>Find Connection, One Journey at a Time</span>
        <div class="social-links" aria-label="Social links">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">◎</a>
          <a href="#" aria-label="Email">✉</a>
        </div>
      </div>

      <nav class="footer-links" aria-label="Footer navigation">
        <div>
          <h3>Explore</h3>
          <router-link to="/explore?mode=places">Places</router-link>
          <router-link to="/explore?mode=routes">Routes</router-link>
          <router-link to="/explore?mode=support">Support Services</router-link>
          <router-link to="/nearby-events">Events</router-link>
        </div>
        <div>
          <h3>Insights</h3>
          <router-link to="/insights">Community Insights</router-link>
          <router-link to="/insights">Activity Reports</router-link>
          <router-link to="/insights">Wellbeing Resources</router-link>
        </div>
        <div>
          <h3>About</h3>
          <router-link to="/insights">About ConnectWell</router-link>
          <router-link to="/insights">Our Mission</router-link>
          <router-link to="/explore?mode=support">Contact Us</router-link>
        </div>
        <div>
          <h3>Need Help?</h3>
          <router-link to="/explore?mode=support">Get in Touch</router-link>
          <router-link to="/explore?mode=support">FAQ</router-link>
          <router-link to="/explore?mode=support">Feedback</router-link>
        </div>
      </nav>

      <div class="footer-bottom">
        <span>© 2025 ConnectWell. All rights reserved.</span>
        <div>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.home-page {
  --ink: #10233f;
  --muted: #516178;
  --green: #1f9a5b;
  --green-dark: #137747;
  --green-soft: #eaf7ef;
  --blue: #1788cf;
  --purple: #6a4bc4;
  --line: #dfe7e4;

  min-height: calc(100vh - 94px);
  background:
    linear-gradient(180deg, #ffffff 0, #ffffff 46%, #fbfdfb 100%),
    #ffffff;
  color: var(--ink);
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(650px, 0.98fr) minmax(500px, 1.02fr);
  gap: 36px;
  align-items: center;
  max-width: 1580px;
  margin: 0 auto;
  padding: 72px 72px 0;
}

.welcome-pill {
  width: fit-content;
  margin: 0 0 24px;
  border-radius: 999px;
  background: #e1f4e8;
  color: #167747;
  padding: 7px 15px;
  font-size: 15px;
  font-weight: 900;
}

.hero-copy h1 {
  margin: 0;
  max-width: 840px;
  color: var(--ink);
  font-size: clamp(48px, 4vw, 68px);
  line-height: 1.12;
  font-weight: 900;
  letter-spacing: 0;
}

.title-line {
  display: block;
  white-space: nowrap;
}

.hero-copy h1 strong {
  color: var(--green-dark);
  font-weight: inherit;
}

.hero-description {
  max-width: 710px;
  margin: 30px 0 0;
  color: var(--muted);
  font-size: clamp(22px, 1.8vw, 28px);
  line-height: 1.58;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin-top: 44px;
}

.btn,
.card-btn,
.community-cta a {
  align-items: center;
  border-radius: 16px;
  display: inline-flex;
  font-weight: 900;
  justify-content: center;
  min-height: 48px;
  text-decoration: none;
}

.btn {
  gap: 16px;
  min-width: 278px;
  min-height: 68px;
  padding: 16px 30px;
  font-size: 22px;
}

.btn-icon {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
}

.btn-primary {
  background: linear-gradient(135deg, #1e9f61, #117a48);
  box-shadow: 0 12px 24px rgba(31, 154, 91, 0.22);
  color: #ffffff;
}

.btn-secondary,
.btn-insight {
  border: 2px solid #c7d0d5;
  background: #ffffff;
  color: var(--ink);
}

.btn-insight {
  color: var(--green-dark);
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 48px;
}

.avatar-stack {
  display: flex;
}

.avatar-stack span {
  display: block;
  width: 52px;
  height: 52px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 35%, #f0c8a0 0 20%, transparent 21%),
    linear-gradient(135deg, #c7d9cf, #7db692);
  box-shadow: 0 4px 10px rgba(16, 35, 63, 0.12);
}

.avatar-stack span + span {
  margin-left: -15px;
}

.avatar-stack span:nth-child(2) {
  background:
    radial-gradient(circle at 50% 35%, #d6a47d 0 20%, transparent 21%),
    linear-gradient(135deg, #e6cfc0, #687a8f);
}

.avatar-stack span:nth-child(3) {
  background:
    radial-gradient(circle at 50% 35%, #b77958 0 20%, transparent 21%),
    linear-gradient(135deg, #cde8d7, #4e9770);
}

.avatar-stack span:nth-child(4) {
  background:
    radial-gradient(circle at 50% 35%, #e2b795 0 20%, transparent 21%),
    linear-gradient(135deg, #e7eef8, #8ca7c5);
}

.confidence-row p {
  max-width: 430px;
  margin: 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.55;
}

.hero-art-wrap {
  display: flex;
  justify-content: center;
}

.hero-art-wrap img {
  display: block;
  width: min(100%, 780px);
  height: auto;
}

.feature-strip {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 40px 24px 46px;
}

.feature-strip h2,
.section-heading h2 {
  margin: 0;
  text-align: center;
  color: var(--ink);
  font-size: clamp(24px, 2.2vw, 30px);
}

.feature-strip h2::after,
.section-heading h2::after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  border-radius: 999px;
  background: var(--green);
  margin: 18px auto 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  max-width: 1220px;
  margin: 32px auto 0;
}

.feature-item {
  padding: 0 24px;
  text-align: center;
}

.feature-item + .feature-item {
  border-left: 1px solid var(--line);
}

.feature-item img {
  display: block;
  width: 74px;
  height: 74px;
  object-fit: contain;
  margin: 0 auto 12px;
}

.feature-item h3 {
  margin: 0 0 8px;
  color: var(--green-dark);
  font-size: 16px;
}

.feature-item p,
.section-heading p,
.journey-card p,
.insights-copy p,
.insight-card p,
.community-cta p {
  color: var(--muted);
  line-height: 1.65;
}

.feature-item p {
  margin: 0;
  font-size: 14px;
}

.journey-section {
  padding: 56px 24px 68px;
}

.section-heading {
  text-align: center;
}

.section-heading p {
  margin: 14px auto 0;
}

.journey-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  max-width: 1160px;
  margin: 36px auto 0;
}

.journey-card {
  border: 1px solid #d9e5de;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 500px;
  padding: 32px 28px 28px;
  text-align: center;
}

.journey-card--places {
  background: linear-gradient(135deg, #f7fcf8, #edf8f0);
}

.journey-card--routes {
  background: linear-gradient(135deg, #f7fbff, #eef7ff);
}

.journey-card--support {
  background: linear-gradient(135deg, #fcf9ff, #f6f0ff);
}

.journey-card img {
  width: 190px;
  height: 190px;
  object-fit: contain;
  margin-bottom: 24px;
}

.journey-card h3 {
  margin: 0;
  color: var(--ink);
  font-size: 25px;
  line-height: 1.18;
}

.journey-card p {
  margin: 16px 0 0;
  max-width: 290px;
  min-height: 80px;
}

.stacked-actions {
  display: grid;
  gap: 12px;
  width: 100%;
  margin-top: auto;
}

.card-btn {
  width: 100%;
  margin-top: auto;
  padding: 11px 16px;
}

.card-btn--green {
  background: linear-gradient(135deg, #1e9f61, #117a48);
  color: #ffffff;
}

.card-btn--outline {
  border: 1px solid var(--green-dark);
  background: #ffffff;
  color: var(--green-dark);
}

.card-btn--blue {
  background: linear-gradient(135deg, #198fd7, #126ea8);
  color: #ffffff;
}

.card-btn--purple {
  background: linear-gradient(135deg, #7658d7, #5434b4);
  color: #ffffff;
}

.insights-preview {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.5fr);
  gap: 36px;
  max-width: 1280px;
  margin: 0 auto 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 80% 20%, rgba(234, 247, 239, 0.95), transparent 34%),
    linear-gradient(135deg, #f4faf7, #ffffff 58%, #f8fbfa);
  padding: 50px 52px 42px;
  box-shadow: inset 0 0 0 1px rgba(223, 231, 228, 0.7);
}

.eyebrow {
  margin: 0 0 14px;
  color: var(--green-dark);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.insights-copy h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.12;
}

.insights-copy p {
  margin: 20px 0 28px;
}

.insight-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.insight-card {
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 16px 32px rgba(16, 35, 63, 0.08);
  min-height: 300px;
  padding: 26px 18px 18px;
  text-align: center;
}

.insight-card img {
  width: 78px;
  height: 78px;
  object-fit: contain;
  margin-bottom: 16px;
}

.insight-card h3 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 17px;
}

.insight-card p {
  margin: 0;
  font-size: 14px;
}

.insight-card-desc {
  min-height: 46px;
}

.insight-card strong {
  display: block;
  margin-top: 12px;
  color: var(--blue);
  font-size: 30px;
  line-height: 1;
}

.insight-card:nth-child(2) strong {
  color: var(--green);
}

.insight-card:nth-child(3) strong {
  color: var(--purple);
}

.mini-chart {
  display: flex;
  align-items: end;
  height: 48px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, transparent, rgba(23, 136, 207, 0.1));
}

.mini-chart span {
  display: block;
  width: 100%;
  height: 34px;
  clip-path: polygon(
    0 72%,
    16% 66%,
    28% 70%,
    42% 55%,
    56% 62%,
    70% 42%,
    84% 48%,
    100% 28%,
    100% 100%,
    0 100%
  );
  background: rgba(23, 136, 207, 0.18);
  border-top: 3px solid var(--blue);
}

.mini-chart--green {
  background: linear-gradient(180deg, transparent, rgba(31, 154, 91, 0.1));
}

.mini-chart--green span {
  clip-path: polygon(0 80%, 18% 78%, 34% 64%, 50% 70%, 66% 56%, 82% 62%, 100% 36%, 100% 100%, 0 100%);
  background: rgba(31, 154, 91, 0.16);
  border-top-color: var(--green);
}

.mini-chart--purple {
  background: linear-gradient(180deg, transparent, rgba(106, 75, 196, 0.1));
}

.mini-chart--purple span {
  clip-path: polygon(0 70%, 16% 52%, 32% 66%, 48% 38%, 64% 54%, 80% 46%, 100% 24%, 100% 100%, 0 100%);
  background: rgba(106, 75, 196, 0.16);
  border-top-color: var(--purple);
}

.insight-note {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

.insight-note span {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid #8dd3aa;
  border-radius: 999px;
  color: var(--green-dark);
  font-size: 12px;
  font-weight: 900;
}

.community-cta {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 22px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto 0;
  border-radius: 22px;
  background: linear-gradient(135deg, #eef8f2, #f8fcfa);
  box-shadow: inset 0 0 0 1px rgba(223, 231, 228, 0.78);
  padding: 22px 48px;
}

.community-cta img {
  width: 82px;
  height: 82px;
  object-fit: contain;
}

.community-cta h2 {
  margin: 0;
  color: var(--ink);
  font-size: 22px;
}

.community-cta p {
  margin: 8px 0 0;
}

.community-cta a {
  background: var(--green-dark);
  color: #ffffff;
  padding: 10px 18px;
}

.home-footer {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.8fr);
  gap: 34px;
  max-width: 1280px;
  margin: 10px auto 0;
  border-radius: 22px 22px 0 0;
  background: #ffffff;
  box-shadow: inset 0 1px 0 var(--line);
  padding: 30px 48px 34px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-brand img {
  display: block;
  width: 180px;
  height: auto;
}

.footer-brand span {
  color: var(--muted);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.social-links {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.social-links a {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--green-dark);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
}

.footer-links h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.footer-links a {
  display: block;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
  text-decoration: none;
}

.footer-bottom {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
  border-top: 1px solid var(--line);
  padding-top: 20px;
  color: var(--muted);
  font-size: 13px;
}

.footer-bottom div {
  display: flex;
  gap: 28px;
}

.footer-bottom a {
  color: var(--muted);
  text-decoration: none;
}

@media (max-width: 1024px) {
  .hero-section,
  .insights-preview,
  .community-cta,
  .home-footer {
    max-width: 100%;
  }

  .hero-section {
    grid-template-columns: 1fr;
    gap: 26px;
    padding-top: 38px;
    text-align: center;
  }

  .hero-description {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions,
  .confidence-row {
    justify-content: center;
  }

  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px 0;
  }

  .feature-item:nth-child(4) {
    border-left: 0;
  }

  .journey-grid,
  .insights-preview {
    grid-template-columns: 1fr;
  }

  .insight-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hero-section,
  .feature-strip,
  .journey-section,
  .insights-preview,
  .community-cta,
  .home-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-copy h1 {
    font-size: 39px;
  }

  .hero-description {
    font-size: 16px;
  }

  .btn,
  .hero-actions,
  .confidence-row,
  .community-cta a {
    width: 100%;
  }

  .confidence-row {
    flex-direction: column;
  }

  .confidence-row p {
    max-width: 320px;
    text-align: center;
  }

  .feature-grid,
  .journey-grid,
  .insight-card-grid,
  .community-cta,
  .home-footer,
  .footer-links {
    grid-template-columns: 1fr;
  }

  .feature-item,
  .feature-item + .feature-item {
    border-left: 0;
    border-top: 1px solid var(--line);
    padding: 20px 0 0;
  }

  .feature-item:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .journey-card {
    min-height: auto;
  }

  .insights-preview {
    padding-top: 30px;
    padding-bottom: 30px;
  }

  .community-cta {
    text-align: center;
  }

  .community-cta img {
    margin: 0 auto;
  }

  .footer-bottom,
  .footer-bottom div {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
