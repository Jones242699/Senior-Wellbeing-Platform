export const EXPLORE_MODES = [
  {
    id: 'places',
    title: 'Discover Places',
    subtitle: 'Find calm public spaces, cafes, libraries, gardens, art, and accessible stops nearby.',
    path: '/discover-nearby-places',
    actionLabel: 'Open Places',
    tone: 'places',
    stats: ['Live distance filtering', 'Crowd density overlay', 'Detailed place cards'],
  },
  {
    id: 'routes',
    title: 'Plan a Route',
    subtitle: 'Create a route with travel mode choices, rest stops, toilets, and route preferences.',
    path: '/my-routes',
    actionLabel: 'Plan Route',
    tone: 'routes',
    stats: ['Walking, cycling, driving', 'Toilets and benches', 'Preference-aware routing'],
  },
  {
    id: 'support',
    title: 'Mental Support',
    subtitle: 'Locate nearby counseling rooms and compare travel options from your current or chosen address.',
    path: '/nearby-mental-support',
    actionLabel: 'Find Support',
    tone: 'support',
    stats: ['Address-based search', 'Counseling room list', 'Travel mode routes'],
  },
]
