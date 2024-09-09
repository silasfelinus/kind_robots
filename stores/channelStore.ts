import { defineStore } from 'pinia'
import type { Channel, Message, Reaction } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'
import { useArtStore } from './../stores/artStore'
import { useGalleryStore } from './../stores/galleryStore'
import { useUserStore } from './../stores/userStore'
import { usePromptStore } from './../stores/promptStore'
import { usePitchStore } from './../stores/pitchStore'
import { useComponentStore } from './../stores/componentStore'
import { useTagStore } from './../stores/tagStore'

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    reactions: [] as Reaction[],
    isInitialized: false as boolean,
    currentChannel: null as Channel | null,
    loading: false,
    defaultChannels: {
      general: 1, // Hardset channel "general" as ID 1
      user: null,
      gallery: null,
      art: null,
      prompt: null,
      pitch: null,
      component: null,
      tag: null,
    },
  }),

  getters: {
    // Getters for related stores' channels
    artChannel: (state) => {
      const artStore = useArtStore()
      return state.channels.find(channel => channel.id === artStore.selectedArt?.channelId) || null
    },
    galleryChannel: (state) => {
      const galleryStore = useGalleryStore()
      return state.channels.find(channel => channel.id === galleryStore.currentGallery?.channelId) || null
    },
    userChannel: (state) => {
      const userStore = useUserStore()
      return state.channels.find(channel => channel.userId === userStore.userId) || null
    },
    promptChannel: (state) => {
      const promptStore = usePromptStore()
      return state.channels.find(channel => channel.id === promptStore.selectedPrompt?.channelId) || null
    },
    pitchChannel: (state) => {
      const pitchStore = usePitchStore()
      return state.channels.find(channel => channel.id === pitchStore.selectedPitch?.channelId) || null
    },
    componentChannel: (state) => {
      const componentStore = useComponentStore()
      return state.channels.find(channel => channel.id === componentStore.selectedComponent?.channelId) || null
    },
    tagChannel: (state) => {
      const tagStore = useTagStore()
      return state.channels.find(channel => channel.id === tagStore.selectedTag?.channelId) || null
    },
  },

  actions: {
    // Initialize channels and set the default ones
    async initializeChannels() {
      if (this.isInitialized) return;
      try {
        await this.fetchChannels();  // Fetch the channels from the API
        this.currentChannel = this.channels.find(
          (channel) => channel.id === this.defaultChannels.general
        ) || null;
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing channels:', error);
      }
    },

    // Set the default channels by their IDs
    setDefaultChannels({
      generalId = 1,
      userId = null,
      galleryId = null,
      artId = null,
      promptId = null,
      pitchId = null,
      componentId = null,
      tagId = null,
    }) {
      this.defaultChannels = {
        general: generalId,
        user: userId,
        gallery: galleryId,
        art: artId,
        prompt: promptId,
        pitch: pitchId,
        component: componentId,
        tag: tagId,
      }
    },

    // Fetch channels from the database or API
    async fetchChannels() {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels') // Fetch from your API
        const data = await res.json()

        if (data.success) {
          this.channels = data.channels // Load channels from the API response
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error fetching channels',
        )
      } finally {
        this.loading = false
      }
    },

    // Set the current active channel
    setCurrentChannel(channelId: number) {
      this.currentChannel = this.channels.find((ch) => ch.id === channelId) || null
    },

    // Fetch messages for a specific channel
    async fetchMessagesByChannelId(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true

      try {
        const res = await fetch(`/api/channels/${channelId}/messages`)
        const data = await res.json()

        if (data.success) {
          this.messages = [...data.messages] // Reset and load messages
        } else {
          throw new Error(data.message || 'Failed to fetch messages')
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error fetching messages',
        )
      } finally {
        this.loading = false
      }
    },

    // Remove a channel by its ID
    async removeChannel(id: number) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' })
        if (res.ok) {
          this.channels = this.channels.filter((channel) => channel.id !== id)
          if (this.currentChannel?.id === id) {
            this.currentChannel = null
          }
        } else {
          throw new Error('Failed to remove channel')
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Error removing channel',
        )
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Channel, Message, Reaction }
