import { defineStore } from 'pinia'
import type { Channel, Message, Reaction } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'
import { useUserStore } from './../stores/userStore'

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    reactions: [] as Reaction[], // Add reactions to handle multiple reactions
    isInitialized: false as boolean,
    currentChannel: null as Channel | null,
    loading: false,
  }),

  actions: {
    // Method to get channels associated with a component via its reactions
    getChannelsForComponent(componentId: number) {
      const reactionsForComponent = this.reactions.filter(
        (reaction) => reaction.componentId === componentId,
      )
      const channelIds = new Set(
        reactionsForComponent.map((reaction) => reaction.channelId),
      )
      return this.channels.filter((channel) => channelIds.has(channel.id))
    },

    // Method to get messages associated with a channel
    getMessagesForChannel(channelId: number) {
      return this.messages.filter((message) => message.channelId === channelId)
    },

    // Fetch channels associated with a specific component
    async fetchChannelsByComponentId(componentId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      return errorStore
        .handleError(
          async () => {
            const res = await fetch(`/api/components/${componentId}/channels`)
            const data = await res.json()

            if (data.success) {
              this.channels = data.channels
            } else {
              throw new Error(data.message || 'Failed to fetch channels')
            }
          },
          ErrorType.NETWORK_ERROR,
          'Error fetching channels',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Fetch messages for a specific channel
    async fetchMessagesByChannelId(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      return errorStore
        .handleError(
          async () => {
            const res = await fetch(`/api/channels/${channelId}/messages`)
            const data = await res.json()

            if (data.success) {
              this.messages.push(...data.messages)
            } else {
              throw new Error(data.message || 'Failed to fetch messages')
            }
          },
          ErrorType.NETWORK_ERROR,
          'Error fetching messages',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Fetch reactions for a specific component
    async fetchReactionsByComponentId(componentId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      return errorStore
        .handleError(
          async () => {
            const res = await fetch(`/api/components/${componentId}/reactions`)
            const data = await res.json()

            if (data.success) {
              this.reactions = data.reactions
            } else {
              throw new Error(data.message || 'Failed to fetch reactions')
            }
          },
          ErrorType.NETWORK_ERROR,
          'Error fetching reactions',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Initialize channels if not already done
    async initializeChannels() {
      if (this.isInitialized) return
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          await this.fetchChannels()
          this.isInitialized = true
        },
        ErrorType.UNKNOWN_ERROR,
        'Error initializing channels',
      )
    },

    // Set the current active channel by ID
    setCurrentChannel(channelId: number) {
      const channel = this.channels.find((ch) => ch.id === channelId)
      if (channel) this.currentChannel = channel
    },

    // Create or update a channel
    async createOrUpdateChannel(channel: Partial<Channel>) {
      const userStore = useUserStore()
      const userId = userStore.userId
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          const method = channel.id ? 'PATCH' : 'POST'
          const url = channel.id
            ? `/api/channels/${channel.id}`
            : '/api/channels'
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...channel, userId }),
          })
          const updatedChannel = await res.json()

          if (channel.id) {
            const index = this.channels.findIndex((ch) => ch.id === channel.id)
            if (index !== -1) this.channels[index] = updatedChannel
          } else {
            this.channels.push(updatedChannel)
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error creating or updating channel',
      )
    },

    clearCurrentChannel() {
      this.currentChannel = null
    },

    // Fetch the current channel along with its messages
    async fetchCurrentChannelWithMessages(channelId: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch(`/api/channels/${channelId}`)
          const data = await res.json()
          if (data.success) {
            this.currentChannel = data.channel
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error fetching current channel with messages',
      )
    },

    // Fetch all available channels
    async fetchChannels() {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch('/api/channels')
          const data = await res.json()

          if (data.success) {
            this.channels = data.channels
          }
        },
        ErrorType.NETWORK_ERROR,
        'Error fetching channels',
      )
    },

    // Remove a channel by its ID
    async removeChannel(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' })
          if (res.ok) {
            this.channels = this.channels.filter((channel) => channel.id !== id)
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error removing channel',
      )
    },

    // Fetch all messages
    async fetchMessages() {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch('/api/messages')
          const data = await res.json()

          if (data.success) {
            this.messages = data.messages
          }
        },
        ErrorType.NETWORK_ERROR,
        'Error fetching messages',
      )
    },

    // Create a new message
    async createMessage(message: Partial<Message>) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
          })
          const data = await res.json()

          if (data.success) {
            this.messages.push(data.message)
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error creating message',
      )
    },

    // Update an existing message
    async updateMessage(message: Message) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch(`/api/messages/${message.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
          })
          const data = await res.json()

          if (data.success) {
            const index = this.messages.findIndex(
              (msg) => msg.id === message.id,
            )
            if (index !== -1) this.messages[index] = data.message
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error updating message',
      )
    },

    // Remove a message by its ID
    async removeMessage(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
          if (res.ok) {
            this.messages = this.messages.filter((message) => message.id !== id)
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error removing message',
      )
    },
  },
})

export type { Channel, Message, Reaction }
