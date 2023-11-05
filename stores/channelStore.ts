import { defineStore } from 'pinia';
import { type Channel, type Message } from '@prisma/client';
import { errorHandler } from '../server/api/utils/error';
import { useUserStore } from '@/stores/userStore';

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    isInitialized: false as boolean,
    currentChannel: null as Channel | null,
  }),

  actions: {
    async initializeChannels() {
      if (!this.isInitialized) {
        // Use `this.isInitialized` instead of `isInitialized`
        try {
          await this.fetchChannels();
          this.isInitialized = true; // Use `this.isInitialized` to update the state
        } catch (error: any) {
          const handledError = errorHandler(error);
          console.error('Error initializing channels:', handledError.message);
        }
      }
    },

    setCurrentChannel(channelId: number) {
      const channel = this.channels.find((ch) => ch.id === channelId);
      if (channel) {
        this.currentChannel = channel;
      }
    },

    async createOrUpdateChannel(channel: Partial<Channel>) {
      const userStore = useUserStore();
      const userId = userStore.userId;
      try {
        const method = channel.id ? 'PATCH' : 'POST';
        const url = channel.id ? `/api/channels/${channel.id}` : '/api/channels';
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...channel, userId }),
        });
        const updatedChannel = await res.json();
        if (channel.id) {
          const index = this.channels.findIndex((ch) => ch.id === channel.id);
          if (index !== -1) {
            this.channels[index] = updatedChannel;
          }
        } else {
          this.channels.push(updatedChannel);
        }
      } catch (error: any) {
        throw errorHandler(error);
      }
    },

    // Method to clear the current channel
    clearCurrentChannel() {
      this.currentChannel = null;
    },

    async fetchCurrentChannelWithMessages(channelId: number) {
      try {
        const res = await fetch(`/api/channels/${channelId}`);
        const data = await res.json();
        if (data.success) {
          this.currentChannel = data.channel;
        }
      } catch (error: any) {
        throw errorHandler(error);
      }
    },

    async fetchChannels() {
      try {
        const res = await fetch('/api/channels');
        const data = await res.json();
        if (data.success) {
          this.channels = data.channels;
        }
      } catch (error: any) {
        throw errorHandler(error);
      }
    },

    async removeChannel(id: number) {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.channels = this.channels.filter((channel) => channel.id !== id);
      }
    },
    async fetchMessages() {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.success) {
        this.messages = data.messages;
      }
    },

    async createMessage(message: Partial<Message>) {
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
        const data = await res.json();
        if (data.success) {
          this.messages.push(data.message);
        }
      } catch (error: any) {
        throw errorHandler(error);
      }
    },

    async updateMessage(message: Message) {
      try {
        const res = await fetch(`/api/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
        const data = await res.json();
        if (data.success) {
          const index = this.messages.findIndex((msg) => msg.id === message.id);
          if (index !== -1) {
            this.messages[index] = data.message;
          }
        }
      } catch (error: any) {
        throw errorHandler(error);
      }
    },

    async removeMessage(id: number) {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.messages = this.messages.filter((message) => message.id !== id);
      }
    },
  },
});

export type { Channel, Message };
