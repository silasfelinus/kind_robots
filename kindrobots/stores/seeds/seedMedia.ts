// ~/stores/seeds/seedMedia.ts
import { Media } from '@prisma/client' // Import the Media type based on your actual types file

export const mediaData: Partial<Media>[] = [
  {
    path: '/images/image1.jpg',
    isNSFW: false,
    tags: 'AI, Cafe Purr',
    designer: 'John Doe',
    description: 'A beautiful AI-generated image.',
    userId: 1
  },
  {
    path: '/images/image2.jpg',
    isNSFW: false,
    tags: 'AI, Cafe Purr',
    designer: 'Jane Smith',
    description: 'Another stunning AI-generated image.',
    userId: 2
  }
  // Add more sample data as needed
]
