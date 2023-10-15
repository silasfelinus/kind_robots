interface navigationData {
  title: string
  image: string
  description: string
  path: string
}

export const userNavigation: navigationData[] = [
  {
    title: 'Welcome',
    image: '/images/kindart.webp',
    description: 'About Kind Robots',
    path: '/about'
  },
  {
    title: 'Brainstorm!!!!!',
    image: '/images/avatars/brain1.webp',
    description: 'Generate and share brainstorms',
    path: '/brainstorm'
  },
  {
    title: 'BotCafe',
    image: '/images/botcafe/botcafe-268.webp',
    description: 'Chat with our friendly bots',
    path: '/botcafe'
  },
  {
    title: 'Art Pitchmaker',
    image: '/images/fantasycore/fantasycore-915.webp',
    description: 'Create and share pitches for our community AI-Art generator.',
    path: '/artmaker'
  },
  {
    title: 'Rebel Button',
    image: '/images/ducky/ducky-516.webp',
    description: 'I cannot advise trying to get to the top of this leaderboard.',
    path: '/button'
  },
  {
    title: 'Jellybeans',
    image: '/images/fantasycore/fantasycore-749.webp',
    description: 'A Record of Discovered Jellybeans, and Clues to their Whereabouts.',
    path: '/milestones'
  },
  {
    title: 'Art Match',
    image: '/images/cafepurr/cafepurr-395.webp',
    description: 'Memory Match using art from our digital art galleries',
    path: '/memory'
  },
  {
    title: 'AMI',
    image: '/images/amibotsquare1.webp',
    description: 'Meet AMI, the Anti-Malaria Intelligence.',
    path: '/amibot'
  },
  {
    title: 'Theme Changer',
    image: '/images/redbubble/redbubble-1141.webp',
    description: 'Customize your experience in the Kind Universe',
    path: '/theme'
  }
]
