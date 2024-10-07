import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

export const useChatStore = defineStore({
  id: 'chat',
  state: () => ({
    chatExchanges: [] as ChatExchange[],
    currentPrompt: '' as string, // For keeping track of user's input
    isInitialized: false, // Track if the store has been initialized
  }),
  getters: {
    // Computed property to get chat exchanges by the current user
    chatExchangesByUserId: (state) => {
      const userStore = useUserStore();
      return state.chatExchanges.filter((exchange: ChatExchange) => exchange.userId === userStore.user?.id);
    },
        // Get public chat exchanges (excluding the user's own)
        publicChatExchanges(state) {
          const userStore = useUserStore()
          return state.chatExchanges.filter(
            (exchange: ChatExchange) => exchange.isPublic && exchange.userId !== userStore.user?.id
          )
        },
  },
  actions: {
    // Initialization method to load chat exchanges from localStorage or fetch from backend
    async initialize() {
      if (this.isInitialized) return; // Avoid multiple initializations

      const errorStore = useErrorStore();
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('chatExchanges')) {
          // Load from localStorage
          this.chatExchanges = JSON.parse(localStorage.getItem('chatExchanges') as string);
        } else {
          // Fetch from backend (assuming userStore is already initialized)
          const userStore = useUserStore();
          if (userStore.user?.id) {
            await this.fetchChatExchangesByUserId(userStore.user.id);
          }
        }
        this.saveToLocalStorage(); // Save loaded data to localStorage
        this.isInitialized = true; // Mark as initialized
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to initialize chat exchanges.' + error);
      }
    },

    async fetch(url: string, options: RequestInit = {}) {
      const errorStore = useErrorStore();
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          let errorMessage = `HTTP error! Status: ${response.status}`;
          const errorDetails = await response.json().catch(() => null); // Try to parse error details
          if (errorDetails?.message) {
            errorMessage += ` - ${errorDetails.message}`;
          }
          throw new Error(errorMessage);
        }
        return await response.json();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during fetch';
        errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage);
        console.error('Fetch error:', errorMessage);
        throw error;
      }
    },

// Add or update ChatExchange and return it
async addOrUpdateExchange(prompt: string, userId: number, botId?: number) {
  const userStore = useUserStore();
  const botStore = useBotStore();
  const promptStore = usePromptStore();

  // Check that required values are present (botId is now optional)
  if (!prompt || !userId) {
    this.handleError(ErrorType.VALIDATION_ERROR, 'Required data missing: prompt or userId.');
    return;
  }

  try {
    // Add prompt to the promptStore first, optionally passing botId
    const promptData = await promptStore.addPrompt(prompt, userId, botId ?? 1);

    if (!promptData || !promptData.id) {
      throw new Error('Failed to add the prompt to the promptStore.');
    }

    // Set botName based on whether botId is provided
    const botName = botId ? botStore.currentBot?.name ?? 'Unknown Bot' : 'No Bot Assigned';

    const exchange: ChatExchange = {
      createdAt: new Date(),
      updatedAt: new Date(),
      username: userStore.username ?? 'Unknown User',
      previousEntryId: null, // Set for follow-ups, if any
      botName: botName, // Use botName variable
      userPrompt: prompt,
      botResponse: '', // Placeholder, populated after AI response
      isPublic: false,
      userId,
      botId: botId ?? null, // Optionally include botId
      promptId: promptData.id, // Link to the new prompt
    };

    // Send the chat exchange to the backend for processing
    const response = await this.fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exchange),
    });

    if (!response.success) {
      // More specific error handling
      throw new Error(`Failed to add/update exchange: ${response.message || 'Unknown error'}`);
    }

    const newExchange = response.newExchange;
    if (!newExchange) {
      throw new Error('Backend returned invalid data. No new exchange found.');
    }

    // Successfully added the exchange
    this.chatExchanges.push(newExchange);
    this.saveToLocalStorage(); // Save updated chats to localStorage

    return newExchange;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in addOrUpdateExchange:', errorMessage);
    this.handleError(ErrorType.NETWORK_ERROR, errorMessage);
    throw error; // Rethrow error if needed for further handling
  }
},

    
    async getPublic() {
      await this.fetchChatExchanges() // Fetch all chat exchanges
    },

    // Toggle public/private status of a chat exchange
    async togglePublic(exchangeId: number) {
      const exchange = this.getExchangeById(exchangeId)
      if (exchange) {
        const newPublicState = !exchange.isPublic // Toggle current state

        try {
          await this.fetch(`/api/chats/${exchangeId}/togglePublic`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isPublic: newPublicState }),
          })
          exchange.isPublic = newPublicState // Update local state
        } catch (error) {
          this.handleError(ErrorType.NETWORK_ERROR, 'Failed to toggle public state' + error)
        }
      }
    },
    async fetchChatExchanges() {
      try {
        const data = await this.fetch('/api/chats')
        this.chatExchanges = data.chatExchanges // Populate all chat exchanges
      } catch (error) {
        this.handleError(ErrorType.NETWORK_ERROR, 'Failed to fetch chat exchanges' + error)
      }
    },

    // Handle follow-up messages linked to previous ChatExchange
    async sendFollowUpMessage(exchangeId: number, followUpPrompt: string) {
      const exchange = this.getExchangeById(exchangeId)
      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Chat exchange not found.')
        return
      }

      const followUpExchange = {
        ...exchange,
        previousEntryId: exchange.id,
        userPrompt: followUpPrompt,
        updatedAt: new Date(),
      }

      const data = await this.fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpExchange),
      })

      if (data.success) {
        const updatedExchange = data.newExchange
        this.chatExchanges.push(updatedExchange)
        this.saveToLocalStorage(); // Save updated chats to localStorage
        return updatedExchange
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to send follow-up message: ${data.message}`)
      }
    },

    // Get a chat exchange by ID
    getExchangeById(id: number) {
      return this.chatExchanges.find((exchange: ChatExchange) => exchange.id === id) || null
    },

    // Set exchanges in state
    setChatExchanges(exchanges: ChatExchange[]) {
      this.chatExchanges = exchanges
    },

    // Fetch all chat exchanges for a specific bot
    async fetchChatExchangesByBot(botId: number) {
      const data = await this.fetch(`/api/chats/bot/${botId}`)
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch exchanges for bot ${botId}: ${data.message}`)
      }
    },

    // Fetch all chat exchanges for a specific user
    async fetchChatExchangesByUserId(userId: number) {
      const data = await this.fetch(`/api/chats/user/${userId}`)
      if (data.success) {
        this.setChatExchanges(data.chatExchanges)
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to fetch exchanges for user ${userId}: ${data.message}`)
      }
    },

    // Load chat exchanges from localStorage (when client)
    loadFromLocalStorage() {
      if (typeof window !== 'undefined') {
        const savedExchanges = localStorage.getItem('chatExchanges')
        if (savedExchanges) {
          this.chatExchanges = JSON.parse(savedExchanges)
        }
      }
    },

    // Save exchanges to localStorage
    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatExchanges', JSON.stringify(this.chatExchanges))
      }
    },

    // Add reaction to a ChatExchange
    async addReaction(exchangeId: number, reaction: ReactionType) {
      const exchange = this.getExchangeById(exchangeId)
      if (!exchange) {
        this.handleError(ErrorType.VALIDATION_ERROR, 'Chat exchange not found.')
        return
      }

      const data = await this.fetch(`/api/reactions/chat/${exchangeId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      })

      if (data.success) {
        exchange.Reactions.push(data.newReaction)
      } else {
        this.handleError(ErrorType.VALIDATION_ERROR, `Failed to add reaction: ${data.message}`)
      }
    },

    // Error handling
    handleError(type: ErrorType, message: string) {
      const errorStore = useErrorStore()
      errorStore.setError(type, message)
      console.error(message)
    },
  },
})

export type { ChatExchange }
