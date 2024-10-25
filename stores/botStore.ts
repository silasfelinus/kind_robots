import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { botData } from './seeds/seedBots'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null,
    currentImagePath: '', // Track the image path of the current bot
    loading: false,
    isLoaded: false, // Track whether the store has been loaded
    page: 1,
    pageSize: 100,
    botPrompt: '',
  }),

  getters: {
    // Computed property to return the total number of bots
    totalBots: (state) => state.bots.length,

    // Computed property to return the selected bot's ID
    selectedBotId: (state) => state.currentBot?.id ?? null,
  },

  actions: {
    // Universal error handler
    handleError(err: unknown, action: string) {
      const errorStore = useErrorStore()

      if (err instanceof Error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `An error occurred while ${action}: ${err.message}`,
        )
      } else {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          `An unknown error occurred while ${action}.`,
        )
      }
    },

    // Select a bot by ID and update currentBot and currentImagePath
    async selectBot(botId: number) {
      try {
        if (this.currentBot?.id === botId) {
          console.log('Bot is already selected.')
          return
        }

        const foundBot = this.bots.find((bot) => bot.id === botId)
        if (!foundBot) {
          throw new Error(`Bot with ID ${botId} not found`)
        }

        this.currentBot = foundBot
        this.currentImagePath = foundBot.avatarImage || ''
        console.log('Bot selected successfully:', this.currentBot)
      } catch (error) {
        this.handleError(error, 'selecting bot')
      }
    },

    // Deselect current bot
    deselectBot() {
      this.currentBot = null
      this.currentImagePath = ''
      console.log('Bot deselected.')
    },

    // Fetch bots only if not loaded already
    async fetchBots(): Promise<void> {
      if (this.isLoaded) return

      this.loading = true
      try {
        const response = await fetch('/api/bots')
        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.statusText}`)
        }
        const data = await response.json()
        this.bots = data.bots
        this.isLoaded = true
      } catch (error) {
        this.handleError(error, 'fetching bots')
      } finally {
        this.loading = false
      }
    },

    // Load store, called during initial app launch
    async loadStore(): Promise<void> {
      if (this.isLoaded || this.loading) return

      this.loading = true
      try {
        await this.fetchBots()
        this.isLoaded = true
      } catch (error) {
        this.handleError(error, 'loading store')
      } finally {
        this.loading = false
      }
    },

    // Update a single bot
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`Failed to update bot: ${response.statusText}`)
        }

        const updatedBot = await response.json()
        const botIndex = this.bots.findIndex((bot) => bot.id === id)

        if (botIndex !== -1) {
          this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot }
        }

        this.currentBot = updatedBot
        this.currentImagePath = updatedBot.avatarImage
        console.log('Bot updated successfully:', this.currentBot)
      } catch (error) {
        this.handleError(error, 'updating bot')
      }
    },

    // Delete a bot by ID
    async deleteBot(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`Failed to delete bot: ${response.statusText}`)
        }

        this.bots = this.bots.filter((bot) => bot.id !== id)
        console.log('Bot deleted successfully.')
      } catch (error) {
        this.handleError(error, 'deleting bot')
      }
    },

    // Add bots to the store
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`Failed to add bots: ${response.statusText}`)
        }

        const data = await response.json()
        this.bots = [...this.bots, ...data.bots]
      } catch (error) {
        this.handleError(error, 'adding bots')
      }
    },

    // Fetch bot by ID
    async getBotById(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch bot: ${response.statusText}`)
        }

        const data = await response.json()
        this.currentBot = data.bot
        this.currentImagePath = data.bot.avatarImage
      } catch (error) {
        this.handleError(error, 'fetching bot by id')
      }
    },

    // Seed bots (used for development)
    async seedBots(): Promise<void> {
      try {
        await this.addBots(botData)
        await this.fetchBots()
      } catch (error) {
        this.handleError(error, 'seeding bots')
      }
    },
  },
})

export type { Bot }
