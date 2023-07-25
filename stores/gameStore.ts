// ~/store/games.ts
import { defineStore } from 'pinia'
import { Game as GameRecord } from '@prisma/client'
import axios from 'axios'

export type Game = GameRecord

interface GamesState {
  games: Game[]
  currentGame: Game | null
  totalGames: number
  errors: string[]
}

export const useGameStore = defineStore({
  id: 'games',
  state: (): GamesState => ({
    games: [],
    currentGame: null,
    totalGames: 0,
    errors: []
  }),
  actions: {
    async getGames(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/games?page=${page}&pageSize=${pageSize}`)
      this.games = data
    },
    async getGameById(id: number) {
      const { data } = await axios.get(`/api/games/${id}`)
      this.currentGame = data
    },
    async addGames(gamesData: Partial<Game>[]) {
      const { data } = await axios.post(`/api/games`, gamesData)
      this.games = data.games
      this.errors = data.errors

      // Update the total games count after adding new games
      await this.countGames()
    },
    async updateGame(id: number, data: Partial<Game>) {
      const { data: updatedGame } = await axios.put(`/api/games/${id}`, data)
      this.currentGame = updatedGame

      // Fetch the updated list of games after updating a game
      await this.getGames()
    },
    async deleteGame(id: number) {
      await axios.delete(`/api/games/${id}`)

      // Fetch the updated list of games and total games count after deleting a game
      await this.getGames()
      await this.countGames()
    },
    async randomGame() {
      const { data } = await axios.get(`/api/games/random`)
      this.currentGame = data
    },
    async countGames() {
      const { data } = await axios.get(`/api/games/count`)
      this.totalGames = data
    },
    async loadStore() {
      try {
        await this.getGames()
        return `Loaded ${this.games.length} games`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})
