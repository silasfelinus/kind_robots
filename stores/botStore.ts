import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { botData } from './seeds/seedBots'
import { errorHandler } from '@/server/api/utils/error' // Import your errorHandler

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null,
    totalBots: 0,
    loading: false,
    _initialized: false,
    page: 1,
    pageSize: 100,
    error: null as string | null,
  }),

  actions: {
    async fetchBots(): Promise<void> {
      try {
        const response = await fetch('/api/bots')
        if (!response.ok) {
          this.error = `Failed to fetch bots: ${response.statusText}`
          return
        }
        const data = await response.json()
        this.bots = data.bots
      }
      catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    async loadStore(): Promise<void> {
      this.loading = true
      try {
        await this.fetchBots() // Call fetchBots here
      }
      finally {
        this.loading = false
      }
    },

    async updateBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.bots = this.bots.map((bot) => {
          const updatedBot = data.bots.find((b: Bot) => b.id === bot.id)
          return updatedBot || bot
        })
      }
      catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to update bots: ' + error,
          statusCode: 500,
        })
      }
    },
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedBot = await response.json()
        this.currentBot = updatedBot
        await this.fetchBots()
      }
      catch (error) {
        errorHandler({ success: false, message: 'Failed to update bot: ' + error, statusCode: 500 })
      }
    },

    async deleteBot(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        await this.fetchBots()
      }
      catch (error) {
        errorHandler({ success: false, message: 'Failed to delete bot: ' + error, statusCode: 500 })
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch(`/api/bots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.bots = [...this.bots, ...data.bots]
        this.totalBots += data.bots.length
      }
      catch (error) {
        errorHandler({ success: false, message: 'Failed to add bots: ' + error, statusCode: 500 })
      }
    },

    async getBotById(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
      }
      catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to fetch bot by id: ' + error,
          statusCode: 500,
        })
      }
    },

    async getBotByName(name: string): Promise<void> {
      try {
        const response = await fetch(`/api/bot/name/${name}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
      }
      catch (error) {
        errorHandler({
          success: false,
          message: 'Failed to fetch bot by name: ' + error,
          statusCode: 500,
        })
      }
    },

    seedBots: async function (): Promise<void> {
      try {
        await this.addBots(botData)
        await this.fetchBots()
      }
      catch (error) {
        errorHandler(error) // Use your errorHandler
      }
    },
  },
})

export type { Bot }
