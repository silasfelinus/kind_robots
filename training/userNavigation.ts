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
    description:
      'Pitches art collections inspired (and beginning) with the same prompt (The "Pitch"). Any phrase can become a new pitch, and designers are encouraged to use that as inspiration for fresh art using our community art generator.',
    path: '/artmaker'
  },
  {
    title: 'Rebel Button',
    image: '/images/ducky/ducky-516.webp',
    description: 'I cannot advise trying to get to the top of this leaderboard.',
    path: '/button'
  },
  {
    title: 'Milestones',
    image: '/images/fantasycore/fantasycore-749.webp',
    description: 'A Record of User Discovered Jellybeans, and clues to their whereabouts.',
    path: '/milestones'
  },
  {
    title: 'Art Match',
    image: '/images/cafepurr/cafepurr-395.webp',
    description: 'Match art from our galleries.',
    path: '/memory'
  },
  {
    title: 'AMI',
    image: '/images/wonderchest/wonderchest-1691.webp',
    description: 'Meet AMI, the anti-malaria intelligence.',
    path: '/amibot'
  },
  {
    title: 'Theme Changer',
    image: '/images/redbubble/redbubble-1141.webp',
    description: 'Customize your experience in the Kind Universe',
    path: '/theme'
  }
]
