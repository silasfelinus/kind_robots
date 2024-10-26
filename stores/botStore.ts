import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'
import { usePromptStore } from './promptStore' // Import promptStore

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

        // Update the promptStore with the bot's userIntro
        const promptStore = usePromptStore()
        if (foundBot.userIntro) {
          // Use the setPromptsFromString method to parse the userIntro
          promptStore.setPromptsFromString(foundBot.userIntro)
        } else {
          promptStore.promptArray = [] // Reset if no userIntro
        }

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

    // Fetch prompt string from promptStore and include it in the bot update
    async updateBot(id: number): Promise<void> {
      const promptStore = usePromptStore() // Use promptStore

      try {
        const botData = {
          ...this.botForm,
          avatarImage: this.currentImagePath,
          userIntro: promptStore.getFinalPromptString(), // Get prompt string
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
        const botIndex = this.bots.findIndex((bot) => bot.id === id)
        if (botIndex !== -1) {
          this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot }
        }

        this.currentBot = updatedBot
        this.botForm = { ...updatedBot }
        this.currentImagePath = updatedBot.avatarImage
      } catch (error) {
        this.handleError(error, 'updating bot')
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

    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botsData),
        })
        if (!response.ok) throw new Error(`Failed to add bots`)
        const data = await response.json()
        this.bots = [...this.bots, ...data.bots]
      } catch (error) {
        this.handleError(error, 'adding bots')
      }
    },

    async getBotById(id: number): Promise<void> {
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) throw new Error(`Failed to fetch bot`)
        const data = await response.json()
        this.currentBot = data.bot
        this.botForm = { ...data.bot }
        this.currentImagePath = data.bot.avatarImage
      } catch (error) {
        this.handleError(error, 'fetching bot by id')
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
