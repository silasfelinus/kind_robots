// /stores/botStore.ts
import { defineStore } from 'pinia'
import type { Bot } from '@prisma/client'
import { botData } from './seeds/seedBots'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import your errorStore

export const useBotStore = defineStore({
  id: 'botStore',

  state: () => ({
    bots: [] as Bot[],
    currentBot: null as Bot | null,
    totalBots: 0,
    selectedBotId: null as number | null,
    loading: false,
    _initialized: false,
    page: 1,
    pageSize: 100,
  }),

  actions: {
    selectBot(botId: number) {
      // Toggle selection logic, if the same bot is selected, deselect it
      if (this.selectedBotId === botId) {
        this.selectedBotId = null
        this.currentBot = null
      } else {
        this.selectedBotId = botId
        this.currentBot = this.bots.find((bot) => bot.id === botId) || null
      }
    },
    async fetchBots(): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/bots')
        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.statusText}`)
        }
        const data = await response.json()
        this.bots = data.bots
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `An error occurred while fetching bots: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while fetching bots.',
          )
        }
      }
    },

    async loadStore(): Promise<void> {
      this.loading = true
      try {
        await this.fetchBots()
      } finally {
        this.loading = false
      }
    },

    async updateBots(botsData: Partial<Bot>[]): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to update bots: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while updating bots.',
          )
        }
      }
    },

    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const updatedBot = await response.json()
        this.currentBot = updatedBot
        await this.fetchBots()
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to update bot: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while updating the bot.',
          )
        }
      }
    },

    async deleteBot(id: number): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/bot/id/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        await this.fetchBots()
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to delete bot: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while deleting the bot.',
          )
        }
      }
    },

    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botsData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        this.bots = [...this.bots, ...data.bots]
        this.totalBots += data.bots.length
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to add bots: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while adding bots.',
          )
        }
      }
    },

    async getBotById(id: number): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/bot/id/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to fetch bot by id: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while fetching bot by id.',
          )
        }
      }
    },

    async getBotByName(name: string): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/bot/name/${name}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        this.currentBot = data.bot
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to fetch bot by name: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while fetching bot by name.',
          )
        }
      }
    },

    async seedBots(): Promise<void> {
      const errorStore = useErrorStore()
      try {
        await this.addBots(botData)
        await this.fetchBots()
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorStore.setError(
            ErrorType.NETWORK_ERROR,
            `Failed to seed bots: ${err.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'An unknown error occurred while seeding bots.',
          )
        }
      }
    },
  },
})

export type { Bot }
