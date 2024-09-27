<template>
  <div
    class="channel-manager bg-base-300 p-4 rounded-2xl border border-base-300 flex flex-col h-full w-full space-y-4"
  >
    <!-- Channel Management Header -->
    <div
      class="bg-primary p-3 rounded-xl text-white flex justify-between items-center"
    >
      <h2 class="text-2xl font-bold">Channel Manager</h2>
      <button class="btn btn-secondary" @click="initializeChannels">
        Refresh Channels
      </button>
    </div>

    <!-- Channel List Section -->
    <div class="flex flex-1">
      <!-- Channel List -->
      <div
        class="w-1/3 bg-accent p-3 rounded-xl m-1 flex flex-col space-y-3 border border-accent-content"
      >
        <h3 class="text-lg font-semibold text-white">Channels</h3>
        <ul class="flex flex-col space-y-2 overflow-auto">
          <li
            v-for="channel in channels"
            :key="channel.id"
            class="flex justify-between items-center p-2 bg-base-300 rounded-lg text-white border"
          >
            <span>{{ channel.title }}</span>
            <div class="flex space-x-2">
              <button
                class="btn btn-sm btn-primary"
                :disabled="isCurrentChannel(channel.id)"
                @click="setCurrentChannel(channel.id)"
              >
                Select
              </button>
              <button
                class="btn btn-sm btn-error"
                @click="removeChannel(channel.id)"
              >
                Remove
              </button>
            </div>
          </li>
        </ul>

        <!-- Empty State for Channels -->
        <div v-if="channels.length === 0" class="text-white text-center p-4">
          No channels available. Please create a new channel.
        </div>

        <!-- Create Channel Section -->
        <div class="mt-auto">
          <input
            v-model="newChannelName"
            type="text"
            placeholder="New Channel Name"
            class="input input-bordered w-full mb-2 text-black"
          />
          <button
            class="btn btn-success w-full"
            :disabled="!newChannelName || isLoading"
            @click="createChannel"
          >
            <span v-if="isLoading">Creating...</span>
            <span v-else>Create Channel</span>
          </button>
        </div>
      </div>

      <!-- Channel Messages Section -->
      <div
        class="flex-1 bg-base-300 p-3 rounded-xl m-1 border border-base-content flex flex-col"
      >
        <!-- Selected Channel Info -->
        <div
          v-if="currentChannel"
          class="bg-secondary p-3 rounded-xl text-white mb-4"
        >
          <h3 class="text-lg font-bold">
            {{ currentChannel.title }} (ID: {{ currentChannel.id }})
          </h3>
        </div>

        <!-- No Channel Selected Message -->
        <div v-else class="flex-1 flex justify-center items-center text-white">
          <p>Select a channel to view messages</p>
        </div>

        <!-- Messages List -->
        <div v-if="messages.length > 0" class="flex-1 overflow-y-auto">
          <ul class="space-y-2">
            <li
              v-for="message in messages"
              :key="message.id"
              class="p-2 bg-base-300 rounded-lg border"
            >
              <p>{{ message.content }}</p>
              <small class="text-gray-400">Sent by: {{ message.userId }}</small>
            </li>
          </ul>
        </div>

        <!-- No Messages Info -->
        <div
          v-else-if="currentChannel"
          class="flex-1 flex justify-center items-center text-white"
        >
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
          <button
            class="btn btn-accent mt-2 w-full"
            :disabled="!newMessage || isLoading"
            @click="sendMessage"
          >
            <span v-if="isLoading">Sending...</span>
            <span v-else>Send Message</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChannelStore } from './../../../stores/channelStore'
import { useUserStore } from './../../../stores/userStore' // Import user store

const channelStore = useChannelStore()
const userStore = useUserStore() // Get the user store

const newChannelName = ref('')
const newMessage = ref('')
const isLoading = ref(false) // Loading state

// Initialize channels when the component is mounted
onMounted(() => {
  channelStore.initializeChannels()
})

// Computed properties to get data from the store
const channels = computed(() => channelStore.channels)
const currentChannel = computed(() => channelStore.currentChannel)
const messages = computed(() => channelStore.messages)
const currentUser = computed(() => userStore.user) // Get the current user from the user store

// Create a new channel
const createChannel = async () => {
  isLoading.value = true
  try {
    if (newChannelName.value) {
      await channelStore.createChannel({
        title: newChannelName.value,
        label: newChannelName.value.toLowerCase(),
      })
      newChannelName.value = ''
    }
  } catch (error) {
    console.error('Error creating channel:', error)
  } finally {
    isLoading.value = false
  }
}

// Set the current active channel
const setCurrentChannel = (channelId: number) => {
  channelStore.setCurrentChannel(channelId)
}

// Initialize channels
const initializeChannels = () => {
  channelStore.initializeChannels()
}

// Check if the channel is the current one
const isCurrentChannel = (channelId: number) => {
  return currentChannel.value?.id === channelId
}

// Remove a channel
const removeChannel = async (channelId: number) => {
  if (confirm('Are you sure you want to remove this channel?')) {
    isLoading.value = true
    try {
      await channelStore.removeChannel(channelId)
    } catch (error) {
      console.error('Error removing channel:', error)
    } finally {
      isLoading.value = false
    }
  }
}

// Send a message
const sendMessage = async () => {
  if (newMessage.value && currentChannel.value && currentUser.value) {
    isLoading.value = true
    try {
      await channelStore.sendMessage({
        content: newMessage.value,
        channelId: currentChannel.value.id,
        userId: currentUser.value.id, // Add userId from the current user
        sender: currentUser.value.name || 'Anonymous', // Add sender's name, fallback to 'Anonymous'
      })
      newMessage.value = ''
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<style scoped>
.channel-manager {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.text-white {
  color: white;
}
</style>
