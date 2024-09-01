// ./stores/gameStore.ts
import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'
import type { Game, Player, User } from '@prisma/client'

export enum GameStatus {
  Loading = 'Loading',
  Inactive = 'Inactive',
  Finished = 'Finished',
  New = 'New',
  InProgress = 'InProgress',
}

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
    games: [] as Game[], // Array to store games
    currentGame: null as Game | null, // Currently joined game
    players: [] as Player[], // Array to store players in the current game
    currentPlayer: null as Player | null,
    showChatControl: false,
    showGameControl: false,
    showGameChat: false,
    showUserControl: false,
    showArtChooser: false,
    showArtCreator: false,
    showPitchScreen: false,
    showGameOver: false,
  }),

  actions: {
    async loadGames() {
      const errorStore = useErrorStore()
      this.gameStatus = GameStatus.Loading
      try {
        const response = await fetch('/api/games')
        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }
        const gamesData = await response.json()
        this.games = gamesData
        this.gameStatus = GameStatus.Inactive
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.NETWORK_ERROR,
          'Failed to load games',
        )
        this.gameStatus = GameStatus.Inactive
      }
    },
    toggleChatControl() {
      this.showChatControl = !this.showChatControl
    },
    toggleGameControl() {
      this.showChatControl = !this.showChatControl
    },
    toggleGameChat() {
      this.showChatControl = !this.showChatControl
    },
    toggleUserControl() {
      this.showUserControl = !this.showUserControl
    },
    toggleArtChooser() {
      this.showArtChooser = !this.showArtChooser
    },

    toggleArtCreator() {
      this.showArtCreator = !this.showArtCreator
    },

    togglePitchScreen() {
      this.showPitchScreen = !this.showPitchScreen
    },

    toggleGameOver() {
      this.showGameOver = !this.showGameOver
    },

    async createGame(gameData: Partial<Game>, playerData?: Partial<Player>) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            playerData ? { ...gameData, firstPlayer: playerData } : gameData,
          ),
        })

        if (!response.ok) {
          throw new Error('Failed to create game')
        }

        const newGame = await response.json()
        this.games.push(newGame)
        this.currentGame = newGame
        this.gameStatus = GameStatus.New
        this.userStatus = UserStatus.Playing
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Error creating game',
        )
        this.gameStatus = GameStatus.Inactive
        this.userStatus = UserStatus.Inactive
      }
    },

    async joinGame(gameId: number, playerName: string) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/games/${gameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', playerName }),
        })

        if (!response.ok) {
          throw new Error('Failed to join game')
        }

        const gameData = await response.json()
        this.currentGame = gameData
        this.gameStatus = GameStatus.InProgress
        this.userStatus = UserStatus.Playing
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error joining game with ID ${gameId}`,
        )
        this.gameStatus = GameStatus.Inactive
        this.userStatus = UserStatus.Inactive
      }
    },

    async leaveGame() {
      const errorStore = useErrorStore()
      try {
        if (!this.currentGame) {
          throw new Error('No game to leave')
        }

        const response = await fetch(`/api/games/${this.currentGame.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            playerName: this.user?.name,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to leave game')
        }

        this.currentGame = null
        this.gameStatus = GameStatus.Inactive
        this.userStatus = UserStatus.Left
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Error leaving game',
        )
        this.gameStatus = GameStatus.Inactive
        this.userStatus = UserStatus.Inactive
      }
    },

    async updateGame(gameId: number, updateData: Partial<Game>) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/games/${gameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error('Failed to update game')
        }

        const updatedGame = await response.json()
        this.currentGame = updatedGame
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error updating game with ID ${gameId}`,
        )
      }
    },

    async resolveGame(gameId: number, winnerName: string) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/games/${gameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', winnerName }),
        })

        if (!response.ok) {
          throw new Error('Failed to resolve game')
        }

        this.gameStatus = GameStatus.Finished
        this.userStatus = UserStatus.Inactive
        this.currentGame = null
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error resolving game with ID ${gameId}`,
        )
        this.gameStatus = GameStatus.Inactive
        this.userStatus = UserStatus.Inactive
      }
    },

    async loadPlayers() {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/games/players')
        if (!response.ok) {
          throw new Error('Failed to fetch players')
        }
        const playersData = await response.json()
        this.players = playersData
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.NETWORK_ERROR,
          'Failed to load players',
        )
      }
    },

    async updatePlayer(playerId: number, updateData: Partial<Player>) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/games/players/${playerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error('Failed to update player')
        }

        const updatedPlayer = await response.json()
        const index = this.players.findIndex((player) => player.id === playerId)
        if (index !== -1) {
          this.players[index] = updatedPlayer
        }
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          `Error updating player with ID ${playerId}`,
        )
      }
    },

    async getPlayer(playerId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/games/players/${playerId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch player')
        }
        return await response.json()
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.NETWORK_ERROR,
          `Failed to fetch player with ID ${playerId}`,
        )
        return null
      }
    },
  },
})
