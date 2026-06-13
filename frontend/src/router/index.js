import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MyRoutesView from '../views/MyRoutesView.vue'
import NearbyMentalSupportView from '../views/NearbyMentalSupportView.vue'
import DashboardView from '../views/DashboardView.vue'
import DiscoverNearbyPlacesView from '../features/discover-places/DiscoverNearbyPlacesView.vue'
import NearbyEventsView from '../views/NearbyEventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
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
