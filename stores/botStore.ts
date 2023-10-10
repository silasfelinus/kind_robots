import { defineStore } from 'pinia'
import { Bot } from '@prisma/client'
import { botData } from './seeds/seedBots'
import { errorHandler } from '@/server/api/utils/error' // Import your errorHandler

interface BotStatusData {
  id: number
  name: string
  description: string
  modules: string
}

// Function to create a stylish message from the bot data
function generateBotStatusMessage(botData: BotStatusData): string {
  const { id, name, description, modules } = botData
  return `Bot ID: ${id}, Name: ${name}, Description: ${description}, Modules: ${modules}`
}

export const useBotStore = defineStore({
  id: 'bots',
  state: () => ({
    bots: [],
    currentBot: null as Bot,
    totalBots: 0,
    loading: false,
    _initialized: false,
    page: 1,
    pageSize: 100
  }),

  actions: {
    async loadStore(): Promise<void> {
      if (!this._initialized) {
        this.loading = true
        try {
          await this.countBots()

          if (this.totalBots === 0) {
            await this.seedBots()
          }
          await this.updateBots(botData)
          await this.getBots()

          if (this.totalBots > 0) {
            this.currentBot = this.bots[0] || null
          }

          this._initialized = true
        } catch (error) {
          errorHandler({
            success: false,
            message: 'Error initializing bot store: ' + error,
            statusCode: 500
          }) // Use your errorHandler
        } finally {
          this.loading = false
        }
      }
    },

    async updateBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const { data } = await axios.post(`/api/bots`, botsData)
        this.bots = this.bots.map((bot) => {
          const updatedBot = data.bots.find((b: Bot) => b.id === bot.id)
          return updatedBot || bot
        })
      } catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to update bots: ' + error,
          statusCode: 500
        })
      }
    },
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      try {
        const { data: updatedBot } = await axios.put(`/api/bot/id/${id}`, data)
        this.currentBot = updatedBot
        await this.getBots()
      } catch (error) {
        errorHandler({ success: false, message: 'Failed to update bot: ' + error, statusCode: 500 })
      }
    },

    async deleteBot(id: number): Promise<void> {
      try {
        await axios.delete(`/api/bot/id/${id}`)
        await this.getBots()
      } catch (error) {
        errorHandler({ success: false, message: 'Failed to delete bot: ' + error, statusCode: 500 })
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const { data } = await axios.post(`/api/bots`, botsData)
        this.bots = [...this.bots, ...data.bots]
        this.totalBots += data.bots.length
      } catch (error) {
        errorHandler({ success: false, message: 'Failed to add bots: ' + error, statusCode: 500 })
      }
    },

    async getBots(): Promise<void> {
      try {
        const { data } = await axios.get(`/api/bots`)
        this.bots = [...data.bots]
      } catch (error) {
        errorHandler({ success: false, message: 'Failed to fetch bots: ' + error, statusCode: 500 })
      }
    },

    async getBotById(id: number): Promise<void> {
      try {
        const { data } = await axios.get(`/api/bot/id/${id}`)
        this.currentBot = data.bot
      } catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to fetch bot by id: ' + error,
          statusCode: 500
        })
      }
    },

    async getBotByName(name: string): Promise<void> {
      try {
        const { data } = await axios.get(`/api/bot/name/${name}`)
        this.currentBot = data.bot
      } catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to fetch bot by name: ' + error,
          statusCode: 500
        })
      }
    },

    seedBots: async function (): Promise<void> {
      try {
        await this.addBots(botData)
        await this.getBots()
        await this.countBots()
      } catch (error) {
        errorHandler(error) // Use your errorHandler
      }
    }
  }
})

export type { Bot }
