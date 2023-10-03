// ~/stores/botStore.ts
import { defineStore } from 'pinia'
import { Bot } from '@prisma/client'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { botData } from './seeds/seedBots'

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

interface BotStatusData {
  id: number
  name: string
  description: string
  modules: string
}

let errorStore: ReturnType<typeof useErrorStore>
let statusStore: ReturnType<typeof useStatusStore>

// Function to create a stylish message from the bot data
function generateBotStatusMessage(botData: BotStatusData): string {
  const { id, name, description, modules } = botData
  return `Bot ID: ${id}, Name: ${name}, Description: ${description}, Modules: ${modules}`
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
        const errorStore = useErrorStore()
        const statusStore = useStatusStore()
        this.loading = true
        statusStore.setStatus(StatusType.INFO, 'Loading bot store...')
        try {
          // Get the current count of bots
          await this.countBots()

          // If there are no bots, seed them, else update them
          if (this.totalBots === 0) {
            await this.seedBots()
          }
          await this.updateBots(botData)

          // Load bots
          await this.getBots()

          if (this.totalBots > 0) {
            statusStore.setStatus(StatusType.SUCCESS, `${this.bots.length} bots loaded!`)
            this.currentBot = this.bots[0] || null
          }

          statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.bots.length} bots`)
          this._initialized = true
        } catch (error) {
          errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing bot store: ' + error)
        } finally {
          this.loading = false
        }
      }
    },

    async updateBots(botsData: Partial<Bot>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Updating bots...')
      try {
        const { data } = await axios.post(`/api/bots`, botsData)
        // Merge updated bots with existing bots in the store
        this.bots = this.bots.map((bot) => {
          const updatedBot = data.bots.find((b: Bot) => b.id === bot.id)
          return updatedBot || bot
        })
        statusStore.setStatus(StatusType.SUCCESS, `Updated ${data.bots.length} bots`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update bots: ' + error)
      }
    },

    async setCurrentBotFromRoute(): Promise<void> {
      const route = useRoute()
      const botId = route.params.id as string // Assuming the parameter name is "id"

      if (botId) {
        const id = parseInt(botId, 10)
        if (!isNaN(id)) {
          await this.getBotById(id)
        } else {
          // Handle the error if the ID is not a number
          errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Invalid bot ID in URL')
        }
      }
    },

    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating bot with id ${id}...`)
      try {
        const { data: updatedBot } = await axios.put(`/api/bot/id/${id}`, data)
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
        await axios.delete(`/api/bot/id/${id}`)
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

    // Inside your store, where you are fetching a bot
    getBotById: async function (id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching bot with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/bot/id/${id}`)
        this.currentBot = data.bot

        // Convert the fetched bot to BotStatusData
        const botStatusData: BotStatusData = {
          id: data.bot.id,
          name: data.bot.name,
          description: data.bot.description,
          modules: data.bot.modules
        }
        // Generate the message and update the status
        const message = generateBotStatusMessage(botStatusData)
        statusStore.setStatus(StatusType.SUCCESS, message)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bot by id: ' + error)
      }
    },

    getBotByName: async function (name: string): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching bot with name ${name}...`)
      try {
        const { data } = await axios.get(`/api/bot/name/${name}`)
        this.currentBot = data.bot
        // Convert the fetched bot to BotStatusData
        const botStatusData: BotStatusData = {
          id: data.bot.id,
          name: data.bot.name,
          description: data.bot.description,
          modules: data.bot.modules
        }
        // Generate the message and update the status
        const message = generateBotStatusMessage(botStatusData)
        statusStore.setStatus(StatusType.SUCCESS, message)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch bot by name: ' + error)
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
        const { data } = await axios.get(`/api/bot/random`)
        this.currentBot = data.bot // Assuming that the bot data is stored in the "bot" property
        // Convert the fetched bot to BotStatusData
        const botStatusData: BotStatusData = {
          id: data.bot.id,
          name: data.bot.name,
          description: data.bot.description,
          modules: data.bot.modules
        }
        // Generate the message and update the status
        const message = generateBotStatusMessage(botStatusData)
        statusStore.setStatus(StatusType.SUCCESS, message)
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

export type { Bot }
