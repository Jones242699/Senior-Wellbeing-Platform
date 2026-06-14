import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MyRoutesView from '../features/my-routes/MyRoutesView.vue'
import NearbyMentalSupportView from '../features/mental-support/NearbyMentalSupportView.vue'
import DashboardView from '../views/DashboardView.vue'
import DiscoverNearbyPlacesView from '../features/discover-places/DiscoverNearbyPlacesView.vue'
import NearbyEventsView from '../views/NearbyEventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import ExploreView from '../features/explore/ExploreView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/explore', name: 'explore', component: ExploreView },
    { path: '/my-routes', name: 'my-routes', component: MyRoutesView },
    {
      path: '/discover-nearby-places',
      name: 'discover-nearby-places',
      component: DiscoverNearbyPlacesView
    },
    {
      path: '/nearby-mental-support',
      name: 'nearby-mental-support',
      component: NearbyMentalSupportView
    },
    {
      path: '/nearby-events',
      name: 'nearby-events',
      component: NearbyEventsView
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: EventDetailView
    },
    { path: '/dashboard', name: 'dashboard', component: DashboardView }
  ],
})

export default router
