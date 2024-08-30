import { defineStore } from 'pinia';
import { useErrorStore, ErrorType } from './errorStore';
import type { Channel, User } from '@prisma/client';

// Define the GameStatus enum to represent different states of the game
export enum GameStatus { 
    Loading = 'Loading',
    Inactive = 'Inactive',
    Finished = 'Finished',
    New = 'New',
    InProgress = 'InProgress',
}

// Define the UserStatus enum to represent different states of the user in the game
export enum UserStatus { 
    Inactive = 'Inactive',
    Searching = 'Searching',
    Playing = 'Playing',
    Choosing = 'Choosing',
    Waiting = 'Waiting',
    Left = 'Left',
}

export const useGameStore = defineStore('gameStore', {
  state: () => ({
    gameStatus: GameStatus.Inactive as GameStatus,
    userStatus: UserStatus.Inactive as UserStatus,
    user: null as User | null,
    games: [] as Channel[],  // Array to store game rooms
    currentGame: null as Channel | null, // Currently joined game
  }),

  actions: {
    async loadGames() {
      const errorStore = useErrorStore();
      this.gameStatus = GameStatus.Loading;
      try {
        // Replace this with your actual API call logic
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const gamesData = await response.json();
        this.games = gamesData;
        this.gameStatus = GameStatus.Inactive; // Return to Inactive after loading
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.NETWORK_ERROR,
          'Failed to load game rooms'
        );
        this.gameStatus = GameStatus.Inactive; // Reset to Inactive on error
      }
    },

    async createGame(gameData: Partial<Channel>) {
      const errorStore = useErrorStore();
      try {
        // Replace this with your actual API call logic
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData),
        });

        if (!response.ok) {
          throw new Error('Failed to create game');
        }

        const newGame = await response.json();
        this.games.push(newGame);
        this.currentGame = newGame;
        this.gameStatus = GameStatus.New;
        this.userStatus = UserStatus.Playing;
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Error creating game'
        );
        this.gameStatus = GameStatus.Inactive; // Reset to Inactive on error
        this.userStatus = UserStatus.Inactive; // Reset user status on error
      }
    },

    async joinGame(gameId: number) {
      const errorStore = useErrorStore();
      try {
        // Replace this with your actual API call logic
        const response = await fetch(`/api/games/${gameId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to join game');
        }

        const gameData = await response.json();
        this.currentGame = gameData;
        this.gameStatus = GameStatus.InProgress;
        this.userStatus = UserStatus.Playing;
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error joining game with ID ${gameId}`
        );
        this.gameStatus = GameStatus.Inactive; // Reset to Inactive on error
        this.userStatus = UserStatus.Inactive; // Reset user status on error
      }
    },

    async leaveGame() {
      const errorStore = useErrorStore();
      try {
        if (!this.currentGame) {
          throw new Error('No game to leave');
        }

        // Replace this with your actual API call logic
        const response = await fetch(`/api/games/${this.currentGame.id}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to leave game');
        }

        this.currentGame = null;
        this.gameStatus = GameStatus.Inactive;
        this.userStatus = UserStatus.Left;
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Error leaving game'
        );
        this.gameStatus = GameStatus.Inactive; // Reset to Inactive on error
        this.userStatus = UserStatus.Inactive; // Reset user status on error
      }
    },

    async resolveGame(gameId: number) {
      const errorStore = useErrorStore();
      try {
        // Replace this with your actual API call logic
        const response = await fetch(`/api/games/${gameId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to resolve game');
        }

        this.gameStatus = GameStatus.Finished;
        this.userStatus = UserStatus.Inactive;
        // Optionally update the currentGame or games array if needed
        this.currentGame = null;
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error resolving game with ID ${gameId}`
        );
        this.gameStatus = GameStatus.Inactive; // Reset to Inactive on error
        this.userStatus = UserStatus.Inactive; // Reset user status on error
      }
    },
  },
});
