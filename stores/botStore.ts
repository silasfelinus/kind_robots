// ~/store/bots.ts
import { defineStore } from 'pinia'
import { Bot as BotRecord } from '@prisma/client'
import axios from 'axios'

export type Bot = BotRecord

interface BotsState {
  bots: Bot[]
  currentBot: Bot | null
  totalBots: number
  errors: string[]
}

export const useBotStore = defineStore({
  id: 'bots',
  state: (): BotsState => ({
    bots: [],
    currentBot: null,
    totalBots: 0,
    errors: []
  }),
  actions: {
    async getBots(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/bots?page=${page}&pageSize=${pageSize}`)
      this.bots = data
    },
    setCurrentBot(bot: Bot) {
      this.currentBot = bot
    },
    async getBotById(id: number) {
      const { data } = await axios.get(`/api/bots/${id}`)
      this.currentBot = data
    },
    async addBots(botsData: Partial<Bot>[]) {
      const { data } = await axios.post(`/api/bots`, botsData)
      this.bots = data.bots
      this.errors = data.errors

      // Update the total bots count after adding new bots
      await this.countBots()
    },
    async updateBot(id: number, data: Partial<Bot>) {
      const { data: updatedBot } = await axios.put(`/api/bots/${id}`, data)
      this.currentBot = updatedBot

      // Fetch the updated list of bots after updating a bot
      await this.getBots()
    },
    async deleteBot(id: number) {
      await axios.delete(`/api/bots/${id}`)

      // Fetch the updated list of bots and total bots count after deleting a bot
      await this.getBots()
      await this.countBots()
    },
    async randomBot() {
      const { data } = await axios.get(`/api/bots/random`)
      this.currentBot = data
    },
    async countBots() {
      const { data } = await axios.get(`/api/bots/count`)
      this.totalBots = data
    },
    async loadStore() {
      try {
        await this.getBots()
        return `Loaded ${this.bots.length} bots`
      } catch (error) {
        console.error('Error loading store:', error)
        return 'error'
      }
    }
  }
})
