// ~/stores/seeds/seedProjects.ts
import { Project } from '@prisma/client' // Import the Project type based on your actual types file

export const projectData: Partial<Project>[] = [
  {
    name: 'AI Art Gallery',
    title: 'Café Purr Art Gallery',
    category: 'Art',
    content: "Here's our vision for an AI-powered art gallery.",
    allowComments: false,
    description: 'A gallery showcasing the best AI-generated art.',
    isPublic: true,
    hasAdmission: false,
    usdFee: 0,
    userId: 1
  },
  {
    name: 'AI Game Jam',
    title: 'AI Game Jam 2023',
    category: 'Gaming',
    content: 'Join us for an exciting AI Game Jam event!',
    allowComments: true,
    description: 'A game jam to explore AI in gaming.',
    isPublic: true,
    hasAdmission: true,
    paywallDestination: '/join-game-jam',
    usdFee: 10,
    userId: 2
  }
  // Add more sample data as needed
]
