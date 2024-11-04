import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null, // Original bot from the backend
    botForm: {} as Partial<Bot>, // Bot form to hold temporary changes
    currentImagePath: '', // Track the image path of the current bot
    loading: false,
    isLoaded: false, // Track whether the store has been loaded
  }),

  getters: {
    totalBots: (state) => state.bots.length,
    selectedBotId: (state) => state.currentBot?.id ?? null,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.currentBot) !== JSON.stringify(state.botForm),
  },

  actions: {
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

    async selectBot(botId: number) {
      try {
        if (this.currentBot?.id === botId) return
        const foundBot = this.bots.find((bot) => bot.id === botId)
        if (!foundBot) throw new Error(`Bot with ID ${botId} not found`)

        // Set the current bot and bot form for editing
        this.currentBot = foundBot
        this.botForm = { ...foundBot } // Copy to botForm for editing
        this.currentImagePath = foundBot.avatarImage || ''
      } catch (error) {
        this.handleError(error, 'selecting bot')
      }
    },

    revertBotForm() {
      if (this.currentBot) {
        this.botForm = { ...this.currentBot }
      }
    },

    deselectBot() {
      this.currentBot = null
      this.botForm = {}
      this.currentImagePath = ''
    },

    async fetchBots(): Promise<void> {
      if (this.isLoaded) return
      this.loading = true
      try {
        const response = await fetch('/api/bots')
        if (!response.ok) throw new Error(`Failed to fetch bots`)
        const data = await response.json()
        this.bots = data.bots
        this.isLoaded = true
      } catch (error) {
        this.handleError(error, 'fetching bots')
      } finally {
        this.loading = false
      }
    },

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

    async updateBot(id: number): Promise<void> {
      try {
        const botData = {
          ...this.botForm,
          avatarImage: this.currentImagePath,
        }

        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botData),
        })

        if (!response.ok) {
          throw new Error(`Failed to update bot: ${response.statusText}`)
        }

        const updatedBot = await response.json()

        // Ensure we extract the 'bot' from the response
        if (!updatedBot.bot) {
          throw new Error('API response does not contain bot data')
        }

        // Find the bot in the list and update it
        const botIndex = this.bots.findIndex((bot) => bot.id === id)
        if (botIndex !== -1) {
          this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot.bot }
        }

        this.currentBot = updatedBot.bot
        this.botForm = { ...updatedBot.bot }
        this.currentImagePath = updatedBot.bot.avatarImage
      } catch (error) {
        this.handleError(error, 'updating bot')
        console.error('Error updating bot: ', error)
      }
    },

    async updateCurrentBot(): Promise<void> {
      if (!this.currentBot) {
        console.error('No bot selected to update')
        return
      }

      try {
        const botData = {
          ...this.botForm,
          avatarImage: this.currentImagePath,
        }

        const response = await fetch(`/api/bot/id/${this.currentBot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botData),
        })

        if (!response.ok) {
          throw new Error(`Failed to update bot: ${response.statusText}`)
        }

        const updatedBot = await response.json()

        // Ensure we extract the 'bot' from the response
        if (!updatedBot.bot) {
          throw new Error('API response does not contain bot data')
        }

        // Update the bot in the list
        const botIndex = this.bots.findIndex(
          (bot) => bot.id === this.currentBot?.id,
        )
        if (botIndex !== -1) {
          this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot.bot }
        }

        // Ensure `currentBot` and `botForm` are updated after the update
        this.currentBot = updatedBot.bot
        this.botForm = { ...updatedBot.bot }
        this.currentImagePath = updatedBot.bot.avatarImage
      } catch (error) {
        this.handleError(error, 'updating bot')
        console.error('Error updating current bot: ', error)
      }
    },

    async saveUserIntro(newUserIntro: string): Promise<void> {
      if (!this.currentBot) {
        console.error('No bot selected to update')
        return
      }

      try {
        // Update only the userIntro field in botForm
        this.botForm.userIntro = newUserIntro

        // Use the updateCurrentBot method to send the update to the backend
        await this.updateCurrentBot()
      } catch (error) {
        this.handleError(error, 'updating user intro')
        console.error('Error updating user intro: ', error)
      }
    },

    async deleteBot(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error(`Failed to delete bot`)
        this.bots = this.bots.filter((bot) => bot.id !== id)
      } catch (error) {
        this.handleError(error, 'deleting bot')
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<Bot[]> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) throw new Error(`Failed to add bots`)

        const data = await response.json()

        let addedBots: Bot[] = []

        if (data.bots) {
          addedBots = data.bots
          this.bots = [...this.bots, ...data.bots]
        } else if (data.bot) {
          addedBots = [data.bot]
          this.bots = [...this.bots, data.bot]
        } else {
          throw new Error('API response does not contain bot data')
        }

        return addedBots
      } catch (error) {
        this.handleError(error, 'adding bots')
        console.error('Error adding bots: ', error)
        return []
      }
    },
    async addBot(botData: Partial<Bot>): Promise<Bot | null> {
      try {
        const response = await fetch('/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botData),
        })

        if (!response.ok) throw new Error(`Failed to add bot`)

        const data = await response.json()

        if (data.bot) {
          this.bots = [...this.bots, data.bot]
          return data.bot
        } else {
          throw new Error('API response does not contain bot data')
        }
      } catch (error) {
        this.handleError(error, 'adding bot')
        console.error('Error adding bot: ', error)
        return null
      }
    },

    async getBotById(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) throw new Error(`Failed to fetch bot`)

        const data = await response.json()

        if (!data.bot) {
          throw new Error('API response does not contain bot data')
        }

        this.currentBot = data.bot
        this.botForm = { ...data.bot }
        this.currentImagePath = data.bot.avatarImage
      } catch (error) {
        this.handleError(error, 'fetching bot by id')
        console.error('Error fetching bot by id: ', error)
      }
    },

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
