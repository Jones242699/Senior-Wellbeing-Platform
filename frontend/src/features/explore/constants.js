export const EXPLORE_MODES = [
  {
    id: 'places',
    label: 'Places',
    title: 'Discover Places',
    eyebrow: 'Nearby places',
    path: '/explore?mode=places',
    tone: 'places',
    panelItems: ['Categories', 'Radius', 'Crowd density', 'Places list'],
  },
  {
    id: 'routes',
    label: 'Routes',
    title: 'Plan a Route',
    eyebrow: 'Route planning',
    path: '/explore?mode=routes',
    tone: 'routes',
    panelItems: ['Start', 'Destination', 'Travel mode', 'Route preferences'],
  },
  {
    id: 'support',
    label: 'Support',
    title: 'Mental Support',
    eyebrow: 'Mental support',
    path: '/explore?mode=support',
    tone: 'support',
    panelItems: ['Address search', 'Counseling rooms', 'Travel mode', 'Selected route'],
  },
]

export const EXPLORE_DEFAULT_MODE = 'places'
