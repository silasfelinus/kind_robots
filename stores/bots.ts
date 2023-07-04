// store/bots.ts
import { defineStore } from 'pinia'
import { Bot } from '../types/bot'
import { localBots } from '../botMap'

export const useBotsStore = defineStore('bots', {
  state: () => ({
    bots: localBots as Bot[],
    // Assume that AmiBot is the first bot in your localBots array
    activeBot: localBots[0] as Bot,
    activeBotId: localBots[0] ? localBots[0].id : 0 // added activeBotId
  }),
  getters: {
    getBots(): Bot[] {
      return this.bots
    },
    getActiveBot(): Bot {
      return this.activeBot
    },
    getActiveBotId(): number {
      return this.activeBotId
    },
    getDefaultBot(): Bot {
      return this.bots[0]
    }
  },
  actions: {
    setActiveBot(bot: Bot) {
      this.activeBot = bot
      this.activeBotId = bot.id // update activeBotId whenever activeBot is set
    },
    setActiveBotId(id: number) {
      this.activeBotId = id
      const bot = this.bots.find((bot) => bot.id === id)
      if (bot) this.setActiveBot(bot)
    },
    setBots(bots: Bot[]) {
      this.bots = bots
    },
    resetActiveBot() {
      this.activeBot = this.bots[0]
      this.activeBotId = this.bots[0] ? this.bots[0].id : 0 // reset activeBotId too
    }
  }
})
