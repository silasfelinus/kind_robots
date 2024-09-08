<template>
  <div class="channel-manager bg-base-200 p-4 rounded-2xl border border-base-300 flex flex-col h-full w-full space-y-4">
    <!-- Channel Management Header -->
    <div class="bg-primary p-3 rounded-xl text-white flex justify-between items-center">
      <h2 class="text-2xl font-bold">Channel Manager</h2>
      <button class="btn btn-secondary" @click="initializeChannels">
        Refresh Channels
      </button>
    </div>

    <!-- Channel List Section -->
    <div class="flex flex-1">
      <!-- Channel List -->
      <div class="w-1/3 bg-accent p-3 rounded-xl m-1 flex flex-col space-y-3 border border-accent-content">
        <h3 class="text-lg font-semibold text-white">Channels</h3>
        <ul class="flex flex-col space-y-2 overflow-auto">
          <li
            v-for="channel in channels"
            :key="channel.id"
            class="flex justify-between items-center p-2 bg-base-300 rounded-lg text-white border"
          >
            <span>{{ channel.name }}</span>
            <div class="flex space-x-2">
              <button
                class="btn btn-sm btn-primary"
                @click="setCurrentChannel(channel.id)"
                :disabled="isCurrentChannel(channel.id)"
              >
                Select
              </button>
              <button class="btn btn-sm btn-error" @click="removeChannel(channel.id)">
                Remove
              </button>
            </div>
          </li>
        </ul>

        <!-- Create Channel Section -->
        <div class="mt-auto">
          <input
            v-model="newChannelName"
            type="text"
            placeholder="New Channel Name"
            class="input input-bordered w-full mb-2 text-black"
          />
          <button class="btn btn-success w-full" @click="createChannel" :disabled="!newChannelName">
            Create Channel
          </button>
        </div>
      </div>

      <!-- Channel Messages Section -->
      <div class="flex-1 bg-base-300 p-3 rounded-xl m-1 border border-base-content flex flex-col">
        <!-- Selected Channel Info -->
        <div v-if="currentChannel" class="bg-secondary p-3 rounded-xl text-white mb-4">
          <h3 class="text-lg font-bold">{{ currentChannel.name }} (ID: {{ currentChannel.id }})</h3>
        </div>

        <!-- No Channel Selected Message -->
        <div v-else class="flex-1 flex justify-center items-center text-white">
          <p>Select a channel to view messages</p>
        </div>

        <!-- Messages List -->
        <div v-if="messages.length > 0" class="flex-1 overflow-y-auto">
          <ul class="space-y-2">
            <li v-for="message in messages" :key="message.id" class="p-2 bg-base-100 rounded-lg border">
              <p>{{ message.content }}</p>
              <small class="text-gray-400">Sent by: {{ message.userId }}</small>
            </li>
          </ul>
        </div>

        <!-- No Messages Info -->
        <div v-else-if="currentChannel" class="flex-1 flex justify-center items-center text-white">
          <p>No messages in this channel</p>
        </div>

        <!-- Input for Sending Messages -->
        <div v-if="currentChannel" class="mt-4">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type your message"
            class="input input-bordered w-full text-black"
          />
          <button class="btn btn-accent mt-2 w-full" @click="sendMessage" :disabled="!newMessage">
            Send Message
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useChannelStore } from '@/stores/channelStore'

export default defineComponent({
  setup() {
    const channelStore = useChannelStore()
    const newChannelName = ref<string>('')
    const newMessage = ref<string>('')

    // Fetch channels when the component is mounted
    onMounted(() => {
      channelStore.initializeChannels()
    })

    // Computed properties for easy access to the store's state
    const channels = computed(() => channelStore.channels)
    const currentChannel = computed(() => channelStore.currentChannel)
    const messages = computed(() => channelStore.messages)

    // Method to create a new channel (Mocked here)
    const createChannel = () => {
      if (newChannelName.value) {
        const newChannel = {
          id: Date.now(),
          name: newChannelName.value,
          userId: null, // Add appropriate properties here based on your schema
        }
        channelStore.channels.push(newChannel)
        newChannelName.value = ''
      }
    }

    // Set the current channel
    const setCurrentChannel = (channelId: number) => {
      channelStore.setCurrentChannel(channelId)
      channelStore.fetchMessagesByChannelId(channelId) // Fetch messages when switching channels
    }

    // Check if a channel is the current one
    const isCurrentChannel = (channelId: number) => {
      return channelStore.currentChannel?.id === channelId
    }

    // Remove a channel
    const removeChannel = (channelId: number) => {
      if (confirm('Are you sure you want to remove this channel?')) {
        channelStore.removeChannel(channelId)
      }
    }

    // Send a new message (Mocked here)
    const sendMessage = () => {
      if (newMessage.value && currentChannel.value) {
        const newMsg = {
          id: Date.now(),
          content: newMessage.value,
          channelId: currentChannel.value.id,
          userId: 1, // Mock userId, replace with actual userId
        }
        channelStore.messages.push(newMsg)
        newMessage.value = ''
      }
    }

    return {
      channels,
      currentChannel,
      messages,
      newChannelName,
      newMessage,
      createChannel,
      setCurrentChannel,
      isCurrentChannel,
      removeChannel,
      sendMessage,
    }
  },
})
</script>

<style scoped>
.channel-manager {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
