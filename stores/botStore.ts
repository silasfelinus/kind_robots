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
        const response = await performFetch<Bot[]>('/api/bots')

        if (response.success) {
          this.bots = response.data || []
          this.isLoaded = true
        } else {
          console.warn('Failed to fetch bots:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchBots:', error)
        handleError(error, 'fetching bots')
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
        handleError(error, 'loading store')
      } finally {
        this.loading = false
      }
    },

    async updateBot(id: number): Promise<void> {
      try {
        const botData = { ...this.botForm, avatarImage: this.currentImagePath }
        const response = await performFetch<Bot>(`/api/bot/id/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(botData),
        })

        if (response.success) {
          const updatedBot = response.data
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
        const response = await performFetch<Bot[]>('/api/bots', {
          method: 'POST',
          body: JSON.stringify(botsData),
        })

        if (response.success) {
          const addedBots = response.data || []
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
        const response = await performFetch<Bot>('/api/bot', {
          method: 'POST',
          body: JSON.stringify(botData),
        })

        if (response.success) {
          const newBot = response.data
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
        const response = await performFetch<Bot>(`/api/bot/id/${id}`)

        if (response.success) {
          const bot = response.data
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

    async botImage(botId: number): Promise<string> {
      const bot = this.bots.find((b) => b.id === botId)
      if (!bot || !bot.artImageId) return '/images/bot.webp' // Fallback to default image

      const artStore = useArtStore()
      try {
        const artImage = await artStore.getArtImageById(bot.artImageId)
        return artImage?.imageData || '/images/bot.webp'
      } catch (error) {
        console.error('Error fetching art image:', error)
        return '/images/bot.webp' // Return fallback image on error
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
