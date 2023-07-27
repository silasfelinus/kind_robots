// ~/stores/botStore.ts
import { defineStore } from 'pinia'
import { Bot as BotRecord } from '@prisma/client'
import axios from 'axios'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { botData } from './seeds/seedBots' // Assumed seed file name

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Bot = BotRecord

interface BotStoreState {
  bots: Bot[]
  currentBot: Bot | null
  totalBots: number
  errors: string[]
  page: number
  pageSize: number
}

export const useBotStore = defineStore({
  id: 'bots',
  state: (): BotStoreState => ({
    bots: [],
    currentBot: null,
    totalBots: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading bot store...')
      try {
        // Load bots if necessary
        await this.seedBots()

        // Load other store data
        await this.getBots(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.bots.length} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing bot store: ' + error)
      }
    },
    async getBots(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching bots...')
      try {
        const { data } = await axios.get(`/api/bots?page=${page}&pageSize=${pageSize}`)
        this.bots = [...this.bots, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.bots.length} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bots: ' + error)
      }
    },
    async getBotById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching bot with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/bots/${id}`)
        this.currentBot = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched bot with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bot by id: ' + error)
      }
    },
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new bots...')
      try {
        const { data } = await axios.post(`/api/bots`, botsData)
        this.bots = [...this.bots, ...data.bots]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.bots.length} bots`)
        // Update the total bots count after adding new bots
        await this.countBots()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add bots: ' + error)
      }
    },
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating bot with id ${id}...`)
      try {
        const { data: updatedBot } = await axios.put(`/api/bots/${id}`, data)
        this.currentBot = updatedBot
        statusStore.setStatus(StatusType.SUCCESS, `Updated bot with id ${id}`)
        // Fetch the updated list of bots after updating a bot
        await this.getBots()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update bot: ' + error)
      }
    },
    async deleteBot(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting bot with id ${id}...`)
      try {
        await axios.delete(`/api/bots/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted bot with id ${id}`)
        // Fetch the updated list of bots and total bots count after deleting a bot
        await this.getBots()
        await this.countBots()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete bot: ' + error)
      }
    },
    async randomBot(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random bot...')
      try {
        const { data } = await axios.get(`/api/bots/random`)
        this.currentBot = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random bot')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random bot: ' + error)
      }
    },
    async countBots(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting bots...')
      try {
        const { data } = await axios.get(`/api/bots/count`)
        this.totalBots = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted ${this.totalBots} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count bots: ' + error)
      }
    },
    async seedBots(): Promise<void> {
      // Get the current count of bots
      await this.countBots()

      // If there are no bots, load them
      if (this.totalBots === 0) {
        statusStore.setStatus(StatusType.INFO, 'Seeding bots...')
        try {
          await this.addBots(botData)
          statusStore.setStatus(StatusType.SUCCESS, 'Seeded bots')
          // Fetch the updated list of bots and total bots count after seeding
          await this.getBots()
          await this.countBots()
        } catch (error) {
          errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to seed bots: ' + error)
        }
      }
    }
  }
})
