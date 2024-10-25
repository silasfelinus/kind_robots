import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { botData } from './seeds/seedBots'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null,
    totalBots: 0,
    selectedBotId: null as number | null,
    currentImagePath: '', // Track the image path of the current bot
    loading: false,
    isLoaded: false, // Track whether the store has been loaded
    page: 1,
    pageSize: 100,
    botPrompt: '',
  }),

  actions: {
    // Select a bot by ID and update currentImagePath
    selectBot(botId: number) {
      console.log('Trying to select bot with ID:', botId)
      if (this.selectedBotId === botId) {
        this.deselectBot() // Use helper method for deselecting
      } else {
        this.selectedBotId = botId
        const foundBot = this.bots.find((bot) => bot.id === botId)
        this.currentBot = foundBot || null
        this.currentImagePath = foundBot?.avatarImage || ''
        console.log('Current Image Path:', this.currentImagePath)
      }
    },

    // Helper function to deselect bot
    deselectBot() {
      console.log('Deselecting bot')
      this.selectedBotId = null
      this.currentBot = null
      this.currentImagePath = '' // Clear image path on deselect
    },

    // Reset botPrompt
    resetBotPrompt() {
      this.botPrompt = ''
    },

    // Fetch bots only if not loaded already
    async fetchBots(): Promise<void> {
      if (this.isLoaded) return // Skip if bots are already loaded

      this.loading = true
      try {
        const response = await fetch('/api/bots')
        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.statusText}`)
        }
        const data = await response.json()
        this.bots = data.bots
        this.totalBots = this.bots.length
        this.isLoaded = true // Set loaded flag to true
      } catch (err) {
        this.handleError(err, 'fetching bots')
      } finally {
        this.loading = false
      }
    },

    // Universal error handler
    handleError(err: unknown, action: string) {
      const errorStore = useErrorStore() // Directly call the error store

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

    // Load store, called during initial app launch
    async loadStore(): Promise<void> {
      if (typeof window === 'undefined' || this.isLoaded || this.loading) return
      this.loading = true // Ensure no concurrent loading happens

      try {
        await this.fetchBots()
        this.isLoaded = true // Set to true only after successful load
      } catch (err) {
        this.handleError(err, 'loading the store')
      } finally {
        this.loading = false // Always clear loading flag, even if there's an error
      }
    },

    // Update multiple bots
    async updateBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        this.bots = this.bots.map((bot) => {
          const updatedBot = data.bots.find((b: Bot) => b.id === bot.id)
          return updatedBot || bot
        })
      } catch (err) {
        this.handleError(err, 'updating bots')
      }
    },

    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      try {
        console.log('Updating bot with ID:', id)
        console.log('Data being sent:', data)

        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const updatedBot = await response.json()
        console.log('Bot updated successfully:', updatedBot)

        // Update the current bot
        this.currentBot = updatedBot
        this.currentImagePath = updatedBot.avatarImage
        console.log('Updated currentImagePath:', this.currentImagePath)

        // Update the bots array by replacing the updated bot
        const botIndex = this.bots.findIndex((bot) => bot.id === id)
        if (botIndex !== -1) {
          this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot }
        }

        console.log(
          'Bots array updated successfully after the bot was updated.',
        )
      } catch (err) {
        console.error('Error while updating the bot:', err)
        const errorStore = useErrorStore()
        errorStore.setError(
          ErrorType.GENERAL_ERROR,
          `Error updating bot: ${err}`,
        )
      }
    },
    // Delete a bot by ID
    async deleteBot(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        await this.fetchBots() // Refresh bots after deletion
      } catch (err) {
        this.handleError(err, 'deleting the bot')
      }
    },

    // Add bots
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        this.bots = [...this.bots, ...data.bots]
        this.totalBots += data.bots.length
      } catch (err) {
        this.handleError(err, 'adding bots')
      }
    },

    // Fetch bot by ID
    async getBotById(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
        this.currentImagePath = data.bot.avatarImage
      } catch (err) {
        this.handleError(err, 'fetching bot by id')
      }
    },

    // Fetch bot by name
    async getBotByName(name: string): Promise<void> {
      try {
        const response = await fetch(`/api/bot/name/${name}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
        this.currentImagePath = data.bot.avatarImage
      } catch (err) {
        this.handleError(err, 'fetching bot by name')
      }
    },

    // Seed bots (used for development)
    async seedBots(): Promise<void> {
      try {
        await this.addBots(botData)
        await this.fetchBots()
      } catch (err) {
        this.handleError(err, 'seeding bots')
      }
    },
  },
})

export type { Bot }
