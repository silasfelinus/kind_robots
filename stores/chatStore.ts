import { defineStore } from 'pinia'
import { type ChatExchange } from '@prisma/client'
import { errorHandler } from '@/server/api/utils/error'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[]
  }),
  actions: {
    getExchangeById(id: number) {
      return this.chatExchanges.find((exchange) => exchange.id === id) || null
    },
    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },
    async fetchChatExchanges() {
      try {
        const response = await fetch('/api/chats')
        const data = await response.json()
        if (data.success) {
          this.setChatExchanges(data.chatExchanges)
        } else {
          errorHandler(data)
        }
      } catch (error: any) {
        errorHandler({ success: false, message: error.message, statusCode: 500 })
      }
    },
    async addOrUpdateExchange(exchange: ChatExchange) {
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(exchange)
        })
        const data = await response.json()
        if (data.success) {
          this.chatExchanges.push(data.newExchange)
        } else {
          errorHandler(data)
        }
      } catch (error: any) {
        errorHandler({ success: false, message: error.message, statusCode: 500 })
      }
    },
    async addReaction(
      id: number,
      reaction: { liked?: boolean; hated?: boolean; loved?: boolean; flagged?: boolean }
    ) {
      try {
        const response = await fetch(`/api/chats/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reaction)
        })
        const data = await response.json()
        if (data.success) {
          const index = this.chatExchanges.findIndex((exchange) => exchange.id === id)
          if (index !== -1) {
            this.chatExchanges[index] = { ...this.chatExchanges[index], ...reaction }
          }
        } else {
          errorHandler(data)
        }
      } catch (error: any) {
        errorHandler({ success: false, message: error.message, statusCode: 500 })
      }
    }
  }
})

export type { ChatExchange }
