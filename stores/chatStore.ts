import { defineStore } from 'pinia'
import type { ChatExchange } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import errorStore and ErrorType



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
    async fetchChatExchanges() {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch('/api/chats')
        const data = await response.json()
        if (data.success) {
          this.setChatExchanges(data.chatExchanges)
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch chat exchanges: ${data.message}`,
          )
        }
      } catch {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while fetching chat exchanges',
        )
        console.error(
          `An error occurred while fetching chat exchanges: ${errorStore.getErrors().slice(-1)[0]?.message}`,
        )
      }
    },
    async addOrUpdateExchange(exchange: ChatExchange) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exchange),
        })
        const data = await response.json()
        if (data.success) {
          this.chatExchanges.push(data.newExchange)
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to add or update exchange: ${data.message}`,
          )
        }
      } catch {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while adding or updating an exchange',
        )
        console.error(
          `An error occurred while adding or updating an exchange: ${errorStore.getErrors().slice(-1)[0]?.message}`,
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
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/chats/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reaction),
        })
        const data = await response.json()
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
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to add reaction: ${data.message}`,
          )
        }
      } catch {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while adding a reaction',
        )
        console.error(
          `An error occurred while adding a reaction: ${errorStore.getErrors().slice(-1)[0]?.message}`,
        )
      }
    },
  },
})

export type { ChatExchange }
