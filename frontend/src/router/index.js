import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import NearbyEventsView from '../views/NearbyEventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import ExploreView from '../features/explore/ExploreView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/explore', name: 'explore', component: ExploreView },
    {
      path: '/my-routes',
      redirect: (to) => ({
        path: '/explore',
        query: { ...to.query, mode: 'routes' },
      }),
    },
    {
      path: '/discover-nearby-places',
      redirect: (to) => ({
        path: '/explore',
        query: { ...to.query, mode: 'places' },
      }),
    },
    {
      path: '/nearby-mental-support',
      redirect: (to) => ({
        path: '/explore',
        query: { ...to.query, mode: 'support' },
      }),
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
