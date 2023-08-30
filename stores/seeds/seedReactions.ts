// ~/stores/seeds/seedReactions.ts
import { Reaction, ModelType } from '@prisma/client' // Import the Reaction type based on your actual types file

// Sample data for Reaction seed
export const reactionData: Partial<Reaction>[] = [
  {
    userId: 1,
    reviewTitle: 'Awesome website!',
    modelType: ModelType.RESOURCE,
    modelId: 1,
    content: 'This model works like magic!',
    rating: 5
  },
  {
    userId: 2,
    reviewTitle: 'Great job!',
    modelType: ModelType.GALLERY,
    modelId: 2,
    content: 'Really impressed with the hypernetworks implementation.',
    rating: 4
  }
]
