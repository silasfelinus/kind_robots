// ~/stores/seeds/seedGames.ts
import type { Game } from '@prisma/client' // Import the Game type based on your actual types file

export const gameData: Partial<Game>[] = [
  {
    content: 'Complete the Blue Sky Task',
    category: 'Blue Sky Tasks',
    isFinished: false,
    userId: 1,
    reward: 'A Magic Reward',
    points: 10,
    isPrivate: false,
  },
  {
    content: 'Finish the Puzzle Challenge',
    category: 'Puzzle Challenges',
    isFinished: true,
    userId: 2,
    reward: 'Special Prize',
    points: 20,
    isPrivate: true,
  },
]
