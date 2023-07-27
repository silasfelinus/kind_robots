// ~/stores/seeds/seedPrompts.ts
import { Prompt } from '@prisma/client' // Import the Prompt type based on your actual types file

export const promptData: Partial<Prompt>[] = [
  {
    label: 'AI Art Prompt',
    content: 'Generate an AI artwork inspired by nature.',
    userId: 1
  },
  {
    label: 'Story Prompt',
    content: 'Write a short story about time travel.',
    userId: 2
  }
]
