// ~/stores/botsStore.ts
import { defineStore } from 'pinia'
import { Bot as BotRecord } from '@prisma/client'
import {
  fetchBots,
  fetchBotById,
  addBots,
  updateBot,
  deleteBot,
  randomBot
} from '../server/api/bots'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Bot = BotRecord

interface BotState {
  bots: Bot[]
  selectedBots: Bot[]
  activeBot: Bot | null
}

export const useBotStore = defineStore({
  id: 'bots',
  state: (): BotState => ({
    bots: [],
    selectedBots: [],
    activeBot: null
  }),
  getters: {
    getSelectedBots(): Bot[] {
      return this.selectedBots
    },
    getActiveBot(): Bot | null {
      return this.activeBot || this.selectedBots.slice(-1)[0] || null
    }
  },
  actions: {
    async fetchBots(): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.bots = await fetchBots()
          statusStore.setStatus(StatusType.SUCCESS, 'Bots fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch bots.'
      )
    },
    async fetchBotById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const bot = await fetchBotById(id)
          if (bot) {
            // ensure bot is not null
            const botIndex = this.bots.findIndex((existingBot) => existingBot.id === id)
            if (botIndex !== -1) {
              // Update the bot in the list if it already exists
              this.bots.splice(botIndex, 1, bot)
            } else {
              // Add the bot to the list if it does not already exist
              this.bots.push(bot)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch bot by id.'
      )
    },
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { bots: newBots } = await addBots(botsData)
          this.bots.push(...newBots)
          statusStore.setStatus(StatusType.SUCCESS, `${newBots.length} bot(s) added successfully.`)
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add bots.'
      )
    },
    // For updateBot
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedBot = await updateBot(id, data) // Make sure updateBot API function accepts Partial<Bot>
          if (updatedBot) {
            // ensure updatedBot is not null
            const botIndex = this.bots.findIndex((bot) => bot.id === id)
            if (botIndex !== -1) {
              this.bots.splice(botIndex, 1, updatedBot)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update bot.'
      )
    },

    async deleteBot(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          await deleteBot(id)
          const botIndex = this.bots.findIndex((bot) => bot.id === id)
          if (botIndex !== -1) {
            this.bots.splice(botIndex, 1)
            statusStore.setStatus(StatusType.SUCCESS, 'Bot deleted successfully.')
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete bot.'
      )
    },
    selectBot(botId: number): void {
      const bot = this.bots.find((bot) => bot.id === botId)
      if (bot) {
        this.selectedBots.push(bot)
        this.activeBot = bot
      } else {
        throw new Error('Cannot select bot that does not exist')
      }
    },
    setActiveBot(botId: number): void {
      const bot = this.bots.find((bot) => bot.id === botId)
      if (bot) {
        this.activeBot = bot
      } else {
        throw new Error('Cannot set active bot that does not exist')
      }
    },
    deselectBot(botId: number): void {
      const botIndex = this.selectedBots.findIndex((bot) => bot.id === botId)
      if (botIndex !== -1) {
        this.selectedBots.splice(botIndex, 1)
        this.activeBot = this.selectedBots.slice(-1)[0] || null
      } else {
        throw new Error('Cannot deselect bot that is not selected')
      }
    },
    async randomBot(): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.activeBot = await randomBot()
          statusStore.setStatus(StatusType.SUCCESS, 'Random bot selected successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to select random bot.'
      )
    }
  }
})
