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
  loading: boolean
  _initialized: boolean
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
    loading: false,
    _initialized: false,
    page: 1,
    pageSize: 100
  }),
  actions: {
    async loadStore(): Promise<void> {
      if (!this._initialized) {
        this.loading = true
        statusStore.setStatus(StatusType.INFO, 'Loading bot store...')
        try {
          // Get the current count of bots
          await this.countBots()

          // If there are no bots, seed them
          if (this.totalBots === 0) {
            await this.seedBots()
          }

          // Load bots
          await this.getBots()

          statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.bots.length} bots`)
          this._initialized = true
        } catch (error) {
          errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing bot store: ' + error)
        } finally {
          this.loading = false
        }
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
        // Fetch the updated list of bots after deleting a bot
        await this.getBots()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete bot: ' + error)
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new bots...')
      try {
        const { data } = await axios.post(`/api/bots`, botsData)
        this.bots = [...this.bots, ...data.bots]
        // Increment the totalBots by the number of added bots
        this.totalBots += data.bots.length
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${data.bots.length} new bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add bots: ' + error)
      }
    },

    getBots: async function (): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching bots...')
      try {
        const { data } = await axios.get(`/api/bots`)
        this.bots = [...data.bots]
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.bots.length} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bots: ' + error)
      }
    },
    getBotById: async function (id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching bot with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/bots/${id}`)
        this.currentBot = data.bot
        statusStore.setStatus(StatusType.SUCCESS, `Fetched bot with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bot by id: ' + error)
      }
    },
    seedBots: async function (): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding bots...')
      try {
        await this.addBots(botData)
        statusStore.setStatus(StatusType.SUCCESS, 'Seeded bots')
        await this.getBots()
        await this.countBots()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to seed bots: ' + error)
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
    countBots: async function (): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting bots...')
      try {
        const { data } = await axios.get(`/api/bots/count`)
        this.totalBots = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted ${this.totalBots} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count bots: ' + error)
      }
    }
  }
})
