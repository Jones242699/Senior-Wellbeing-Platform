<template>
  <div class="home-wrapper">

    <!-- ================= HERO ================= -->

    <section class="hero-section">

      <div class="hero-content">

        <div class="hero-inner">

          <p class="hero-tag">
            CITY OF MELBOURNE • AGED 60+
          </p>

          <h1 class="headline">

            <span>
              Find Connection
            </span>

            <span class="text-green">
              Close to Home.
            </span>

          </h1>

          <p class="hero-description">
            Supporting adults aged 60+
            across the City of Melbourne
            through community connection,
            local activities,
            and wellbeing support.
          </p>

          <div class="hero-actions">

            <router-link
              to="/explore?mode=places"
              class="btn-solid"
            >
              Explore Community
            </router-link>

            <router-link
              to="/explore?mode=routes"
              class="btn-outline"
            >
              Route Planning
            </router-link>

          </div>

        </div>

      </div>

    </section>

    <!-- ================= INSIGHTS ================= -->

    <section class="insights-section">

      <div class="insights-wrapper">

        <div class="insights-left">

          <p class="section-tag">
            WHY SOCIAL CONNECTION MATTERS
          </p>

          <h2 class="section-title">
            Staying Connected
            Supports Healthy Ageing
          </h2>

          <p class="section-description">
            Loneliness can affect emotional wellbeing,
            confidence, and quality of life.
            Community participation and accessible support
            help older adults remain socially active.
          </p>

          <router-link
            to="/dashboard"
            class="btn-solid"
          >
            Explore Full Insights
          </router-link>

        </div>

        <div class="insights-right">

          <div class="insight-card">

            <h3>
              1 in 3 Australians
            </h3>

            <p>
              report moderate loneliness
              across different age groups.
            </p>

          </div>

          <div class="insight-card">

            <h3>
              Community Participation
            </h3>

            <p>
              improves emotional wellbeing
              and social confidence.
            </p>

          </div>

          <div class="insight-card">

            <h3>
              Local Accessibility
            </h3>

            <p>
              helps older adults remain
              active and engaged.
            </p>

          </div>

        </div>

      </div>

    </section>

    <!-- ================= JOURNEY ================= -->

    <section class="journey-section">

      <div class="section-header">

        <p class="section-tag">
          HOW WOULD YOU LIKE TO BEGIN?
        </p>

        <h2 class="section-title">
          Explore Melbourne Your Way
        </h2>

      </div>

      <div class="journey-grid">

        <!-- CARD 1 -->

        <div class="journey-card">

          <div class="step-number">
            01
          </div>

          <h3>
            Explore Your Community
          </h3>

          <p>
            Find welcoming places,
            cafés, libraries, parks,
            and local activities nearby.
          </p>

          <div class="card-actions">

            <router-link
              to="/explore?mode=places"
              class="btn-solid"
            >
              Explore Places
            </router-link>

            <router-link
              to="/nearby-events"
              class="btn-outline"
            >
              Explore Events
            </router-link>

          </div>

        </div>

        <!-- CARD 2 -->

        <div class="journey-card featured-card">

          <div class="step-number">
            02
          </div>

          <h3>
            Walk With Confidence
          </h3>

          <p>
            Discover more comfortable
            walking routes with nearby
            facilities and support access.
          </p>

          <router-link
            to="/explore?mode=routes"
            class="btn-solid light-btn"
          >
            Start Route Planning
          </router-link>

        </div>

        <!-- CARD 3 -->

        <div class="journey-card">

          <div class="step-number">
            03
          </div>

          <h3>
            Find Wellbeing Support
          </h3>

          <p>
            Access nearby counselling
            services and wellbeing
            resources across Melbourne.
          </p>

          <router-link
            to="/explore?mode=support"
            class="btn-solid"
          >
            View Support Services
          </router-link>

        </div>

      </div>

    </section>

    <!-- ================= FOOTER ================= -->

    <footer class="footer">

      <div class="footer-content">

        <div class="footer-brand">

          <h3>
            Melbourne Wellbeing Guide
          </h3>

          <p>
            Supporting adults aged 60+
            across the City of Melbourne
            through community engagement
            and social connection.
          </p>

        </div>

        <div class="footer-links">

          <router-link to="/explore?mode=places">
            Places
          </router-link>

          <router-link to="/nearby-events">
            Events
          </router-link>

          <router-link to="/explore?mode=routes">
            Routes
          </router-link>

          <router-link to="/dashboard">
            Insights
          </router-link>

        </div>

      </div>

    </footer>

  </div>
</template>

<style scoped>

.home-wrapper {
  background: #f7faf8;
  color: #1f2937;
}

/* ================= HERO ================= */

.hero-section {
  padding: 140px 32px 120px;

  background:
    linear-gradient(
      rgba(247,250,248,0.82),
      rgba(247,250,248,0.88)
    ),
    url("https://allsaintsseniorliving.com/wp-content/uploads/2023/04/How-Social-Connections-Keep-Seniors-Healthy-Hero.jpg");

  background-size: cover;
  background-position: center;

  border-bottom-left-radius: 48px;
  border-bottom-right-radius: 48px;
}

.hero-content {
  max-width: 1280px;

  margin: 0 auto;

  display: flex;
  justify-content: center;
}

.hero-inner {
  max-width: 760px;

  text-align: center;
}

.hero-tag {
  font-size: 13px;
  font-weight: 700;

  letter-spacing: 1.5px;

  color: #4f7c65;

  margin-bottom: 24px;
}

.headline {
  font-size: 82px;
  line-height: 1.05;

  margin-bottom: 30px;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.text-green {
  color: #4f7c65;
}

.hero-description {
  max-width: 760px;

  margin: 0 auto 42px;

  font-size: 22px;
  line-height: 1.8;

  color: #5f6775;
}

.hero-actions {
  display: flex;

  justify-content: center;

  gap: 16px;
  flex-wrap: wrap;
}

/* ================= INSIGHTS ================= */

.insights-section {
  padding: 40px 32px 56px;
}

.insights-wrapper {
  max-width: 1280px;

  margin: 0 auto;

  display: grid;
  grid-template-columns: 1fr 1fr;

  gap: 40px;
  align-items: start;
}

.section-tag {
  font-size: 13px;
  font-weight: 700;

  letter-spacing: 1.5px;

  color: #4f7c65;

  margin-bottom: 14px;
}

.section-title {
  font-size: 44px;
  line-height: 1.2;

  margin-bottom: 20px;
}

.section-description {
  font-size: 18px;
  line-height: 1.8;

  color: #6b7280;

  margin-bottom: 28px;
}

.insights-right {
  display: grid;
  gap: 18px;
}

.insight-card {
  background: white;

  padding: 28px;

  border-radius: 24px;

  box-shadow:
    0 10px 24px rgba(0,0,0,0.04);
}

.insight-card h3 {
  font-size: 24px;

  margin-bottom: 12px;
}

.insight-card p {
  color: #6b7280;
  line-height: 1.7;
}

/* ================= JOURNEY ================= */

.journey-section {
  padding: 56px 32px 72px;
}

.section-header {
  max-width: 800px;

  margin: 0 auto 48px;

  text-align: center;
}

.journey-grid {
  max-width: 1280px;

  margin: 0 auto;

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(320px, 1fr));

  gap: 24px;
}

.journey-card {
  background: white;

  border-radius: 28px;

  padding: 34px;

  box-shadow:
    0 10px 30px rgba(0,0,0,0.05);

  transition: 0.25s;
}

.journey-card:hover {
  transform: translateY(-4px);
}

.featured-card {
  background:
    linear-gradient(
      135deg,
      #4f7c65,
      #6d967f
    );

  color: white;
}

.step-number {
  width: 52px;
  height: 52px;

  border-radius: 50%;

  background: #edf4ef;

  color: #4f7c65;

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 700;

  margin-bottom: 22px;
}

.featured-card .step-number {
  background: rgba(255,255,255,0.2);
  color: white;
}

.journey-card h3 {
  font-size: 28px;

  margin-bottom: 18px;
}

.journey-card p {
  color: #6b7280;

  line-height: 1.8;

  margin-bottom: 28px;
}

.featured-card p {
  color: rgba(255,255,255,0.88);
}

.card-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ================= BUTTONS ================= */

.btn-solid,
.btn-outline {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  text-decoration: none;

  font-weight: 600;

  border-radius: 14px;

  transition: 0.25s;
}

.btn-solid {
  background: #4f7c65;
  color: white;

  padding: 14px 22px;
}

.btn-solid:hover {
  background: #3f6652;
}

.light-btn {
  background: white;
  color: #4f7c65;
}

.light-btn:hover {
  background: #f2f7f4;
}

.btn-outline {
  border: 1px solid #4f7c65;

  color: #4f7c65;

  padding: 14px 22px;
}

.btn-outline:hover {
  background: #edf4ef;
}

/* ================= FOOTER ================= */

.footer {
  padding: 40px 32px;

  border-top:
    1px solid rgba(0,0,0,0.06);
}

.footer-content {
  max-width: 1280px;

  margin: 0 auto;

  display: flex;

  justify-content: space-between;
  align-items: center;

  gap: 24px;

  flex-wrap: wrap;
}

.footer-brand h3 {
  margin-bottom: 10px;
}

.footer-brand p {
  color: #6b7280;

  line-height: 1.7;

  max-width: 420px;
}

.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-links a {
  text-decoration: none;

  color: #4f7c65;

  font-weight: 600;
}

/* ================= MOBILE ================= */

@media (max-width: 900px) {

  .headline {
    font-size: 56px;
  }

  .section-title {
    font-size: 36px;
  }

  .insights-wrapper {
    grid-template-columns: 1fr;
  }

}

</style>
