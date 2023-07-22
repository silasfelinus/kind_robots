import { defineStore } from 'pinia'
import axios from 'axios'
import { Bot } from '@prisma/client'
import { useThemeStore } from './theme'

export const useBotsStore = defineStore('bots', {
  state: (): { bots: Bot[]; activeBot: Bot | null } => ({
    bots: [],
    activeBot: null
  }),
  getters: {
    activeBot() {
      return this.activeBot
    }
  },
  actions: {
    setActiveBot(bot: Bot) {
      this.activeBot = bot

      const themeStore = useThemeStore()

      if (bot.theme) {
        themeStore.changeTheme(bot.theme)
      }
    },
    setPrompt(botId: number, prompt: string) {
      this.prompts[botId] = prompt
    },
    getPrompts(botId: number): string {
      return this.prompts[botId] || ''
    },
    async fetchBots() {
      const response = await axios.get('/api/bots')
      this.bots = response.data
    },

    async fetchBotById(id: number) {
      const response = await axios.get(`/api/bots/${id}`)
      return response.data
    },

    async createBot(bot: Bot) {
      const response = await axios.post('/api/bots', bot)
      this.bots.push(response.data)
    },

    async updateBot(id: number, bot: Bot) {
      const response = await axios.patch(`/api/bots/${id}`, bot)
      const index = this.bots.findIndex((b) => b.id === id)
      this.$patch({ bots: { [index]: response.data } })
    },

    async deleteBot(id: number) {
      await axios.delete(`/api/bots/${id}`)
      this.bots = this.bots.filter((b) => b.id !== id)
    },
    async sendChat(bot: Bot) {
      const CHAT_URL = '/api/botcafe/chat'

      // create API payload
      const apiPayload = {
        messages: [
          { role: 'system', content: 'you are' + bot.name + 'a helpful' + bot.BotType },
          { role: 'user', content: bot.userIntro + ' ' + bot.prompt }
        ],
        model: bot.model || 'gpt-3.5-turbo',
        maxTokens: bot.maxTokens || 100,
        temperature: bot.temperature || 0.0,
        n: bot.n || 1
      }

      // send the API request
      try {
        const response = await axios.post(CHAT_URL, apiPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // check if response data or choices in response data is undefined
        if (!response.data) {
          console.error('Received unexpected data:', response)
          return
        }
        return response.data
      } catch (error) {
        console.error('Error sending chat:', error)
      }
    },
    // Pinia's init() function
    async $init() {
      await this.fetchBots()
    }
  }
})
