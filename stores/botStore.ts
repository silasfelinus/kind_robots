import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { performFetch, handleError } from './utils'

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null,
    botForm: {} as Partial<Bot>,
    currentImagePath: '',
    loading: false,
    isLoaded: false,
  }),

  getters: {
    totalBots: (state) => state.bots.length,
    selectedBotId: (state) => state.currentBot?.id ?? null,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.currentBot) !== JSON.stringify(state.botForm),
  },

  actions: {
    async selectBot(botId: number) {
      try {
        if (this.currentBot?.id === botId) return
        const foundBot = this.bots.find((bot) => bot.id === botId)
        if (!foundBot) throw new Error(`Bot with ID ${botId} not found`)

        this.currentBot = foundBot
        this.botForm = { ...foundBot }
        this.currentImagePath = foundBot.avatarImage || ''
      } catch (error) {
        handleError(error, 'selecting bot')
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
        console.log('Starting fetchBots...')
        const response = await performFetch<Bot[]>('/api/bots')

        console.log('API response from fetchBots:', response)

        if (response.success) {
          this.bots = response.data || []
          this.isLoaded = true
          console.log('Bots successfully fetched and state updated:', this.bots)
        } else {
          console.warn('Failed to fetch bots:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchBots:', error)
        handleError(error, 'fetching bots')
      } finally {
        this.loading = false
        console.log('fetchBots completed.')
      }
    },

    async loadStore(): Promise<void> {
      if (this.isLoaded || this.loading) return
      this.loading = true
      try {
        await this.fetchBots()
        this.isLoaded = true
      } catch (error) {
        handleError(error, 'loading store')
      } finally {
        this.loading = false
      }
    },

    async updateBot(id: number): Promise<void> {
      try {
        const botData = { ...this.botForm, avatarImage: this.currentImagePath }
        const response = await performFetch<{ bot: Bot }>(`/api/bot/id/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(botData),
        })

        console.log('Response from updateBot:', response)

        if (response.success) {
          const updatedBot = response.data?.bot
          if (updatedBot) {
            const botIndex = this.bots.findIndex((bot) => bot.id === id)
            if (botIndex !== -1) {
              this.bots[botIndex] = { ...this.bots[botIndex], ...updatedBot }
            }
            this.currentBot = updatedBot
            this.botForm = { ...updatedBot }
            this.currentImagePath = updatedBot.avatarImage ?? ' '
          }
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in updateBot:', error)
        handleError(error, 'updating bot')
      }
    },

    async updateCurrentBot(): Promise<void> {
      if (!this.currentBot) {
        console.error('No bot selected to update')
        return
      }
      await this.updateBot(this.currentBot.id)
    },

    async saveUserIntro(newUserIntro: string): Promise<void> {
      if (!this.currentBot) {
        console.error('No bot selected to update')
        return
      }
      this.botForm.userIntro = newUserIntro
      await this.updateCurrentBot()
    },

    async deleteBot(id: number): Promise<void> {
      try {
        const response = await performFetch(`/api/bot/id/${id}`, {
          method: 'DELETE',
        })

        console.log('Response from deleteBot:', response)

        if (response.success) {
          this.bots = this.bots.filter((bot) => bot.id !== id)
          console.log('Bot deleted. Updated bots:', this.bots)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in deleteBot:', error)
        handleError(error, 'deleting bot')
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<Bot[]> {
      try {
        const response = await performFetch<{ bots: Bot[] }>('/api/bots', {
          method: 'POST',
          body: JSON.stringify(botsData),
        })

        console.log('Response from addBots:', response)

        if (response.success) {
          const addedBots = response.data?.bots || []
          this.bots = [...this.bots, ...addedBots]
          return addedBots
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in addBots:', error)
        handleError(error, 'adding bots')
        return []
      }
    },

    async addBot(botData: Partial<Bot>): Promise<Bot | null> {
      try {
        const response = await performFetch<{ bot: Bot }>('/api/bot', {
          method: 'POST',
          body: JSON.stringify(botData),
        })

        console.log('Response from addBot:', response)

        if (response.success) {
          const newBot = response.data?.bot
          if (newBot) {
            this.bots = [...this.bots, newBot]
            return newBot
          }
        }
        throw new Error(response.message)
      } catch (error) {
        console.error('Error in addBot:', error)
        handleError(error, 'adding bot')
        return null
      }
    },

    async getBotById(id: number): Promise<void> {
      try {
        const response = await performFetch<{ bot: Bot }>(`/api/bot/id/${id}`)

        console.log('Response from getBotById:', response)

        if (response.success) {
          const bot = response.data?.bot
          if (bot) {
            this.currentBot = bot
            this.botForm = { ...bot }
            this.currentImagePath = bot.avatarImage ?? ''
          }
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in getBotById:', error)
        handleError(error, 'fetching bot by id')
      }
    },

    async seedBots(): Promise<void> {
      try {
        await this.addBots(botData)
        await this.fetchBots()
      } catch (error) {
        handleError(error, 'seeding bots')
      }
    },
  },
})

export type { Bot }
