<template>
  <div class="home-wrapper">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="glass-panel main-intro">
        <h1 class="headline">
          <span class="text-dark">Find Connection</span><br />
          <span class="text-green">Close to Home.</span>
        </h1>
        <p class="description">
          Growing older shouldn't mean feeling alone. We help Melbourne seniors over 60 discover
          local activities and access mental support resources.
        </p>
        <router-link to="/my-routes" class="btn-solid btn-hero-route btn-large">
          Start Your Customized Route
        </router-link>
      </div>
    </section>

    <!-- Feature Sections -->
    <div class="features-container">
      <!-- Section 1: Dashboard -->
      <section id="community-dashboard" class="feature-section dashboard-bg">
        <p class="feature-step-heading">Step 1</p>
        <div class="feature-card">
          <h2 class="feature-title">Community Health Dashboard</h2>
          <p class="feature-description">
            See key wellbeing trends at a glance.
          </p>
          <ul class="feature-list">
            <li>
              📊 <strong>Quick view:</strong> Core loneliness and wellbeing signals.
            </li>
            <li>
              🧠 <strong>Useful context:</strong> Understand what matters locally.
            </li>
            <li>
              🤝 <strong>Action focus:</strong> Turn insights into support decisions.
            </li>
          </ul>
          <router-link to="/dashboard" class="btn-solid btn-primary btn-large">
            Open Dashboard
          </router-link>
        </div>
      </section>

      <!-- Section 2: Discover Nearby Places -->
      <section id="discover-places" class="feature-section discover-bg">
        <p class="feature-step-heading">Step 2</p>
        <div class="feature-card">
          <h2 class="feature-title">Discover Nearby Places</h2>
          <p class="feature-description">
            Find calm places near home for light social activity.
          </p>
          <ul class="feature-list">
            <li>
              📍 <strong>Nearby options:</strong> Parks, libraries, and community spots.
            </li>
            <li>
              🌿 <strong>Low pressure:</strong> Gentle places to step out comfortably.
            </li>
            <li>
              🗺️ <strong>Easy choice:</strong> Pick what fits your pace today.
            </li>
          </ul>
          <router-link to="/discover-nearby-places" class="btn-solid btn-primary btn-large">
            Discover Places
          </router-link>
        </div>
      </section>

      <!-- Section 3: Route Planning -->
      <section id="custom-routes" class="feature-section routes-bg">
        <p class="feature-step-heading">Step 3</p>
        <div class="feature-card">
          <h2 class="feature-title">Customized Routes</h2>
          <p class="feature-description">
            Plan a route that feels safe, simple, and comfortable.
          </p>
          <ul class="feature-list">
            <li>
              🌲 <strong>Shade aware:</strong> Prefer cooler walking paths.
            </li>
            <li>
              🚻 <strong>Comfort stops:</strong> Find toilets and benches on route.
            </li>
            <li>🚶 <strong>Travel your way:</strong> Walk, cycle, drive, or transit.</li>
          </ul>
          <router-link to="/my-routes" class="btn-solid btn-primary btn-large">
            Start Route Planning
          </router-link>
        </div>
      </section>

      <!-- Section 4: Mental Health -->
      <section id="mental-support" class="feature-section mental-bg">
        <p class="feature-step-heading">Step 4</p>
        <div class="feature-card">
          <h2 class="feature-title">Mental Health Support</h2>
          <p class="feature-description">
            Get support nearby when you need it.
          </p>
          <ul class="feature-list">
            <li>
              📍 <strong>Local services:</strong> Find counseling and support centers fast.
            </li>
            <li>
              🗺️ <strong>Direct guidance:</strong> Open route directions in one click.
            </li>
          </ul>
          <router-link to="/nearby-mental-support" class="btn-solid btn-primary btn-large">
            Find Support
          </router-link>
        </div>
      </section>

      <!-- Section 5: Nearby Events -->
      <section id="nearby-events" class="feature-section events-bg">
        <p class="feature-step-heading">Step 5</p>
        <div class="feature-card">
          <h2 class="feature-title">Nearby Events</h2>
          <p class="feature-description">
            Find local events using your current location or an address.
          </p>
          <ul class="feature-list">
            <li>
              📍 <strong>Location-first:</strong> Search by real-time location or typed address.
            </li>
            <li>
              🎵 <strong>Elderly-friendly:</strong> Community, wellness, music, and social activities.
            </li>
            <li>
              🧾 <strong>Full details:</strong> Open event details, venue info, and ticket links.
            </li>
          </ul>
          <router-link to="/nearby-events" class="btn-solid btn-primary btn-large">
            Explore Events
          </router-link>
        </div>
      </section>
    </div>

    <!-- Footer Credit -->
    <footer class="home-footer">
      <p>&copy; 2026 Melbourne Senior Community Support. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
// No script logic needed for now, but keeping setup for future use
</script>

<style scoped>
.home-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  scroll-behavior: smooth;
  box-sizing: border-box;
  background-color: #f8fbf8;
  background-image:
    linear-gradient(135deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.28) 100%),
    url('@/assets/hero-bg.png');
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-attachment: fixed, fixed;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.home-wrapper *,
.home-wrapper *::before,
.home-wrapper *::after {
  box-sizing: border-box;
}

.hero-section {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.main-intro {
  max-width: 850px;
  margin: 0 20px;
  animation: fadeIn 1s ease-out;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 40px;
  padding: 60px 50px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
}

.headline {
  font-size: 3.75rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.text-dark {
  color: #1e293b;
}
.text-green {
  color: #166534;
}

.description {
  font-size: 1.5rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 36px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* --- Features Sections --- */
.features-container {
  width: 100%;
  max-width: min(100%, 1440px);
  margin-inline: auto;
  padding: 56px clamp(20px, 4vw, 48px) 124px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 28px 32px;
  border-radius: 24px;
  box-sizing: border-box;
}

.feature-section {
  padding: 0;
  min-height: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-step-heading {
  margin: 0;
  font-size: clamp(1.65rem, 2.8vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #166534;
  text-align: left;
  padding-left: 2px;
}

.routes-bg {
  --card-gradient: linear-gradient(155deg, #f0fdf4 0%, #dcfce7 100%);
}

.mental-bg {
  --card-gradient: linear-gradient(155deg, #eff6ff 0%, #dbeafe 100%);
}

.dashboard-bg {
  --card-gradient: linear-gradient(155deg, #f5f3ff 0%, #ede9fe 100%);
}

.discover-bg {
  --card-gradient: linear-gradient(155deg, #fefce8 0%, #fef3c7 100%);
}

.events-bg {
  --card-gradient: linear-gradient(155deg, #ecfeff 0%, #cffafe 100%);
}

.feature-card {
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-wrap: break-word;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.84) 100%),
    var(--card-gradient, #ffffff);
  border: 1px solid rgba(148, 163, 184, 0.26);
  padding: 26px 22px 22px;
  border-radius: 24px;
  box-shadow: 0 14px 28px -16px rgba(15, 23, 42, 0.42);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 30px -18px rgba(15, 23, 42, 0.42);
}

.feature-title {
  font-size: 1.55rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 12px;
}

.feature-description {
  font-size: 0.94rem;
  color: #475569;
  line-height: 1.55;
  margin-bottom: 14px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin-bottom: 18px;
}

.feature-list li {
  font-size: 0.88rem;
  color: #334155;
  margin-bottom: 10px;
  line-height: 1.45;
}

.btn-large {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 12px;
  font-size: 0.93rem;
  letter-spacing: 0.01em;
}

.btn-solid {
  display: inline-block;
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.btn-primary {
  background-color: #22c55e;
  box-shadow: 0 10px 20px -5px rgba(34, 197, 94, 0.45);
}

.btn-primary:hover {
  background-color: #16a34a;
  transform: translateY(-4px);
  box-shadow: 0 15px 25px -5px rgba(22, 163, 74, 0.5);
}

.btn-hero-route {
  margin-top: 24px;
  width: auto;
  padding: 18px 40px;
  font-size: 1.125rem;
  background-color: #22c55e;
  box-shadow: 0 10px 20px -5px rgba(34, 197, 94, 0.45);
}

.btn-hero-route:hover {
  background-color: #16a34a;
  transform: translateY(-4px);
  box-shadow: 0 15px 25px -5px rgba(22, 163, 74, 0.5);
}

.btn-secondary {
  background-color: #3b82f6;
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
}

.btn-secondary:hover {
  background-color: #2563eb;
  transform: translateY(-4px);
  box-shadow: 0 15px 25px -5px rgba(59, 130, 246, 0.5);
}

.home-footer {
  padding: 60px 40px;
  text-align: center;
  background-color: #0f172a;
  color: #64748b;
  font-size: 1rem;
}

/* --- Animations --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Responsive adjustments --- */
@media (min-width: 1280px) {
  .features-container {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    column-gap: 28px;
    row-gap: 32px;
    padding-inline: clamp(24px, 4vw, 56px);
  }
}

@media (max-width: 1279px) and (min-width: 769px) {
  .features-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 26px 30px;
  }
}

@media (max-width: 1024px) {
  .headline {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .features-container {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 28px clamp(16px, 5vw, 28px) 72px;
  }
  .home-wrapper {
    background-attachment: scroll;
  }
  .headline {
    font-size: 2.25rem;
  }
  .glass-panel {
    padding: 24px 12px;
    border-radius: 0;
  }
  .description {
    font-size: 1.125rem;
    margin-bottom: 30px;
  }
  .feature-title {
    font-size: 1.4rem;
  }
  .feature-card {
    padding: 20px 16px;
    border-radius: 18px;
  }
  .feature-description {
    font-size: 0.92rem;
  }
  .feature-list li {
    font-size: 0.86rem;
  }
}
</style>
