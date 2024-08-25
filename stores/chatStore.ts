import { defineStore } from 'pinia';
import type { ChatExchange } from '@prisma/client';
import { useErrorStore, ErrorType } from './../stores/errorStore';

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
  }),
  actions: {
    getExchangeById(id: number) {
      return this.chatExchanges.find((exchange) => exchange.id === id) || null;
    },
    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges;
    },
    async fetch(url: string, options: RequestInit = {}) {
      const errorStore = useErrorStore();
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage);
        console.error(`Network error occurred: ${errorMessage}`);
        throw error;
      }
    },
    async fetchChatExchangesByUserId(userId: number) {
      const data = await this.fetch(`/api/messages/user/${userId}`);
      if (data.success) {
        this.setChatExchanges(data.chatExchanges);
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch chat exchanges for user ${userId}: ${data.message}`);
      }
    },
    async fetchChatExchangesByUserIdAndBotId(userId: number, botId: number) {
      const data = await this.fetch(`/api/messages/user/${userId}/bot/${botId}`);
      if (data.success) {
        this.setChatExchanges(data.chatExchanges);
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch chat exchanges for user ${userId} with bot ${botId}: ${data.message}`);
      }
    },
    async fetchChatExchanges() {
      const data = await this.fetch('/api/chats');
      if (data.success) {
        this.setChatExchanges(data.chatExchanges);
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch chat exchanges: ${data.message}`);
      }
    },
    async addOrUpdateExchange(exchange: ChatExchange) {
      const data = await this.fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exchange),
      });
      if (data.success) {
        this.chatExchanges.push(data.newExchange);
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to add or update exchange: ${data.message}`);
      }
    },
    async addReaction(id: number, reaction: { liked?: boolean; hated?: boolean; loved?: boolean; flagged?: boolean }) {
      const data = await this.fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reaction),
      });
      if (data.success) {
        const index = this.chatExchanges.findIndex((exchange) => exchange.id === id);
        if (index !== -1) {
          this.chatExchanges[index] = {...this.chatExchanges[index], ...reaction};
        }
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to add reaction: ${data.message}`);
      }
    },
    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore();
      errorStore.setError(type, message);
      console.error(message);
    },
  },
});

export type { ChatExchange };
