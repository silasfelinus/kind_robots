// ~/stores/gameStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Game as GameRecord } from '@prisma/client'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'
import { gameData } from './seeds/seedGames'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Game = GameRecord

interface GameStoreState {
  games: Game[]
  currentGame: Game | null
  totalGames: number
  errors: string[]
  page: number
  pageSize: number
}

export const useGameStore = defineStore({
  id: 'games',
  state: (): GameStoreState => ({
    games: [],
    currentGame: null,
    totalGames: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading game store...')
      try {
        await this.countGames()
        if (this.totalGames === 0) {
          await this.seedGames()
        }

        await this.getGames(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.games.length} games`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing game store: ' + error)
      }
    },
    async getGames(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching games...')
      try {
        const { data } = await axios.get(`/api/games?page=${page}&pageSize=${pageSize}`)
        this.games = [...this.games, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.games.length} games`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch games: ' + error)
      }
    },
    async getGameById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching game with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/games/${id}`)
        this.currentGame = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched game with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch game by id: ' + error)
      }
    },
    async addGames(gameData: Partial<Game>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new games...')
      try {
        const { data } = await axios.post(`/api/games`, gameData)
        this.games = [...this.games, ...data.games]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.games.length} games`)
        await this.countGames()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add games: ' + error)
      }
    },
    async updateGame(id: number, data: Partial<Game>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating game with id ${id}...`)
      try {
        const { data: updatedGame } = await axios.put(`/api/games/${id}`, data)
        this.currentGame = updatedGame
        statusStore.setStatus(StatusType.SUCCESS, `Updated game with id ${id}`)
        await this.getGames()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update game: ' + error)
      }
    },
    async deleteGame(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting game with id ${id}...`)
      try {
        await axios.delete(`/api/games/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted game with id ${id}`)
        await this.getGames()
        await this.countGames()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete game: ' + error)
      }
    },
    async randomGame(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random game...')
      try {
        const { data } = await axios.get(`/api/games/random`)
        this.currentGame = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random game')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random game: ' + error)
      }
    },
    async countGames(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting games...')
      try {
        const { data } = await axios.get(`/api/games/count`)
        this.totalGames = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted a total of ${this.totalGames} games`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count games: ' + error)
      }
    },
    async seedGames(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding games...')
      try {
        await this.addGames(gameData)
        statusStore.setStatus(StatusType.SUCCESS, 'Games successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading games: ' + error)
      }

      await this.getGames()
      await this.countGames()
    }
  }
})
