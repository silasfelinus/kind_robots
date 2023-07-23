// ~/stores/bots.ts
import { defineStore } from 'pinia'
import { Bot } from '../types/bot'
import {
  getBots,
  createManyBots,
  updateBot,
  deleteBot,
  randomBot,
  countBots
} from '../server/api/utils/bot'
import { ErrorHandler } from '../server/api/utils/error'

interface BotState {
  bots: Bot[]
  selectedBots: Bot[]
  activeBot: Bot | null
}

export const useBotsStore = defineStore({
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
      this.bots = await ErrorHandler(getBots, 'Error while fetching bots')
    },
    async selectBot(botId: number): Promise<void> {
      const bot = this.bots.find((bot) => bot.id === botId)
      if (bot) {
        this.selectedBots.push(bot)
        this.activeBot = bot
      } else {
        throw new Error('Cannot select bot that does not exist')
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
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      const { count } = await ErrorHandler(
        () => createManyBots(botsData),
        'Error while adding bots'
      )
      // Refresh bots
      if (count > 0) await this.fetchBots()
    },
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      const botIndex = this.bots.findIndex((bot) => bot.id === id)
      if (botIndex !== -1) {
        const updatedBot = await ErrorHandler(() => updateBot(id, data), 'Error while updating bot')
        this.bots.splice(botIndex, 1, updatedBot)
      } else {
        throw new Error('Cannot update bot that does not exist')
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
    async deleteBot(id: number): Promise<void> {
      const botIndex = this.bots.findIndex((bot) => bot.id === id)
      if (botIndex !== -1) {
        await ErrorHandler(() => deleteBot(id), 'Error while deleting bot')
        // Refresh bots
        await this.fetchBots()
      } else {
        throw new Error('Cannot delete bot that does not exist')
      }
    },
    async randomBot(): Promise<void> {
      const bot = await ErrorHandler(randomBot, 'Error while getting random bot')
      if (bot) this.activeBot = bot
    },
    async countBots(): Promise<number> {
      return await ErrorHandler(countBots, 'Error while counting bots')
    }
  }
})
