import { defineStore } from 'pinia'
import type { Channel, Message } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'

export const useChannelStore = defineStore({
  id: 'channel',
  
  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    currentChannel: null as Channel | null,
    loading: false,
    isInitialized: false,
  }),

  actions: {
    // Initialize channels
    async initializeChannels() {
      if (this.isInitialized) return
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels')
        const data = await res.json()

        if (data.success) {
          this.channels = data.channels
          this.isInitialized = true
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error initializing channels'
        )
      } finally {
        this.loading = false
      }
    },

    // Create a new channel
    async createChannel(newChannel: { title: string; label: string }) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newChannel),
        })
        const data = await res.json()
        
        if (data.success) {
          this.channels.push(data.channel)
        } else {
          throw new Error('Failed to create channel')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while creating a channel'
        )
      } finally {
        this.loading = false
      }
    },

    // Set the current active channel
    setCurrentChannel(channelId: number) {
      this.currentChannel = this.channels.find((ch) => ch.id === channelId) || null
    },

    // Remove a channel by its ID
    async removeChannel(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' })
        if (res.ok) {
          this.channels = this.channels.filter((ch) => ch.id !== channelId)
          if (this.currentChannel?.id === channelId) {
            this.currentChannel = null
          }
        } else {
          throw new Error('Failed to remove channel')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while removing channel'
        )
      } finally {
        this.loading = false
      }
    },

    // Send a message to a channel
    async sendMessage(newMessage: { content: string; channelId: number }) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${newMessage.channelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newMessage.content }),
        })
        const data = await res.json()

        if (data.success) {
          this.messages.push(data.message)
        } else {
          throw new Error('Failed to send message')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while sending the message'
        )
      } finally {
        this.loading = false
      }
    },
  },
})
