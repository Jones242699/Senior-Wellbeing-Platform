export const EXPLORE_MODES = [
  {
    id: 'places',
    label: 'Places',
    title: 'Discover Places',
    eyebrow: 'Nearby places',
    path: '/discover-nearby-places',
    tone: 'places',
    panelItems: ['Categories', 'Radius', 'Crowd density', 'Places list'],
  },
  {
    id: 'routes',
    label: 'Routes',
    title: 'Plan a Route',
    eyebrow: 'Route planning',
    path: '/my-routes',
    tone: 'routes',
    panelItems: ['Start', 'Destination', 'Travel mode', 'Route preferences'],
  },
  {
    id: 'support',
    label: 'Support',
    title: 'Mental Support',
    eyebrow: 'Mental support',
    path: '/nearby-mental-support',
    tone: 'support',
    panelItems: ['Address search', 'Counseling rooms', 'Travel mode', 'Selected route'],
  },
]

export const EXPLORE_DEFAULT_MODE = 'places'
