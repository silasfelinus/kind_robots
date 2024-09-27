// ~/stores/seeds/seedGames.ts
import type { Game } from '@prisma/client' // Import the Game type based on your actual types file

export const gameData: Partial<Game>[] = [
  {
    category: 'Blue Sky Tasks',
    descriptor: 'Complete the Blue Sky Task with creativity and innovation.',
    designer: 'User1',
    winner: null, // No winner yet
    isFinished: false,
    isPrivate: false,
    // Assuming you'll handle Users, Art, Prompts, and Players separately
  },
  {
    category: 'Puzzle Challenges',
    descriptor: 'Solve this tricky puzzle to win a prize.',
    designer: 'User2',
    winner: 'User3', // A winner has been decided
    isFinished: true,
    isPrivate: true,
    // Handle related data for Users, Art, Prompts, and Players
  },
]
