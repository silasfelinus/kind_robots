interface navigationData {
  title: string
  componentName: string
  image: string
  description: string
  path: string
}

export const userNavigation: navigationData[] = [
  {
    title: 'Brainstorm!!!!!',
    componentName: 'slogan-maker',
    image: '/images/avatars/brain1.webp',
    description: 'Generate and share brainstorms',
    path: '/brainstorm'
  },
  {
    title: 'Weirdlandia',
    componentName: 'game-generator',
    image: '/images/weirdlandia/weird-32.png',
    description: 'Have a weird adventure!',
    path: '/weirdlandia'
  },
  {
    title: 'BotCafe',
    componentName: 'bot-cafe',
    image: '/images/botcafe/botcafe-268.webp',
    description: 'Chat with our friendly bots',
    path: '/botcafe'
  },
  {
    title: 'ArtMaker',
    componentName: 'ArtMakerComponent',
    image: '/images/fantasycore/fantasycore-747.webp',
    description: 'Create beautiful art effortlessly',
    path: '/artmaker'
  },
  {
    title: 'Choose your Fate',
    componentName: 'dilema-chooser',
    image: '/images/fantasycore/fantasycore-749.webp',
    description: 'Select from 2 moral quandaries',
    path: '/fate'
  },
  {
    title: 'Art Critic',
    componentName: 'art-critic',
    image: '/images/cafepurr/cafepurr-395.webp',
    description: 'Rate our gallery art. Is it art?',
    path: '/critic'
  },
  {
    title: 'Chat with Ami',
    componentName: 'chat-with-ami',
    image: '/images/wonderchest/wonderchest-1691.webp',
    description: 'Meet AMI, the anti-malaria intelligence, and create slogans for her campaign',
    path: '/amibot'
  },
  {
    title: 'User Profile',
    componentName: 'profile-manager',
    image: '/images/redbubble/redbubble-1141.webp',
    description: 'Customize your public data',
    path: '/profile'
  }
]
