import { defineStore } from 'pinia'
import type { ChatExchange } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
  }),
  actions: {
    getExchangeById(id: number) {
      return this.chatExchanges.find((exchange) => exchange.id === id) || null
    },
    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },
    async fetch(url: string, options: RequestInit = {}) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(url, options)
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`)
        return await response.json()
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred'
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
        console.error(`Network error occurred: ${errorMessage}`)
        throw error
      }
    },
    async togglePublic(id: number) {
      const exchange = this.getExchangeById(id)
      if (exchange) {
        const updatedExchange = { ...exchange, isPublic: !exchange.isPublic }
        const data = await this.fetch(`/api/chats/toggle-public/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: updatedExchange.isPublic }),
        })
        if (data.success) {
          // Update local state to reflect the new public status
          const index = this.chatExchanges.findIndex((x) => x.id === id)
          if (index !== -1) {
            this.chatExchanges[index] = updatedExchange
          }
        } else {
          this.handleError(
            ErrorType.VALIDATION_ERROR,
            `Failed to toggle public status: ${data.message}`,
          )
        }
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Chat exchange not found.')
      }
    },
    async fetchChatExchangesByUserId(userId: number) {
      const data = await this.fetch(`/api/messages/user/${userId}`)
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          `Failed to fetch chat exchanges for user ${userId}: ${data.message}`,
        )
      }
    },
    async fetchChatExchanges() {
      const data = await this.fetch('/api/chats')
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          `Failed to fetch chat exchanges: ${data.message}`,
        )
      }
    },
    async addOrUpdateExchange(exchange: ChatExchange) {
      const data = await this.fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exchange),
      })
      if (data.success) {
        this.chatExchanges.push(data.newExchange)
      } else {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          `Failed to add or update exchange: ${data.message}`,
        )
      }
    },
    async addReaction(
      id: number,
      reaction: {
        liked?: boolean
        hated?: boolean
        loved?: boolean
        flagged?: boolean
      },
    ) {
      const data = await this.fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reaction),
      })
      if (data.success) {
        const index = this.chatExchanges.findIndex(
          (exchange) => exchange.id === id,
        )
        if (index !== -1) {
          this.chatExchanges[index] = {
            ...this.chatExchanges[index],
            ...reaction,
          }
        }
      } else {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          `Failed to add reaction: ${data.message}`,
        )
      }
    },
    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore()
      errorStore.setError(type, message)
      console.error(message)
    },
    async getPublic() {
      const data = await this.fetch('/api/chats/public')
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(
          ErrorType.VALIDATION_ERROR,
          `Failed to fetch public chat exchanges: ${data.message}`,
        )
      }
    },
  },
})

export type { ChatExchange }
