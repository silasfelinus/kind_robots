export const sidebarLinks = [
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'mdi:chat-processing' },
  {
    title: 'Pitch Manager',
    path: '/pitch',
    icon: 'fluent:chat-bubbles-question-16-regular',
  },
  { title: 'Art Maker', path: '/artmaker', icon: 'game-icons:easel' },
  { title: 'Hot or Not?', path: '/hotornot', icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', icon: 'mdi:palette' },
  {
    title: 'Art Challenge',
    path: '/artchallenge',
    icon: 'game-icons:tabletop-players',
  },
  {
    title: 'Brainstorm',
    path: '/brainstorm',
    icon: 'game-icons:robot-antennas',
  },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'material-symbols:art-track-outline-rounded',
  },
  { title: 'Dashboard', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  {
    title: 'Mature Content',
    path: '/mature',
    icon: 'fxemoji:lips',
    condition: 'showMature',
  },
  {
    title: 'Wonderlab',
    path: '/wonderlab',
    icon: 'game-icons:gear-hammer',
    condition: 'showMature',
  },
  { title: 'About', path: '/about', icon: 'game-icons:abstract-037' },
]
