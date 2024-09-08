<template>
  <div class="chat-control bg-gray-100 rounded-lg p-4 max-w-full">
    <div class="font-semibold mb-2">Channels:</div>
    <div class="flex flex-wrap gap-2 mb-4">
      <div 
        v-for="channel in nonNullChannels" 
        :key="channel.label" 
        @click="selectChannel(channel)"
        :class="['cursor-pointer px-4 py-2 rounded-lg', selectedChannel?.label === channel.label ? 'bg-primary-dark text-white' : 'bg-primary text-white hover:bg-primary-dark']"
      >
        {{ channel.label }}
      </div>
    </div>

    <!-- Chat Window -->
    <div v-if="selectedChannel" class="chat-window bg-white rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200">
      <div v-for="message in selectedChannelMessages" :key="message.id" 
           :class="['p-2 mb-2 rounded-lg', message.userId === currentUser.id ? 'bg-blue-100 text-blue-900' : 'bg-gray-100']">
        <strong>{{ message.userName }}:</strong> {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChannelStore } from './../../../stores/channelStore'
import { useUserStore } from './../../../stores/userStore'

const channelStore = useChannelStore()
const userStore = useUserStore()
const currentUser = userStore.currentUser

// Computed property to filter non-null labels
const nonNullChannels = computed(() => {
  return channelStore.channels.filter(channel => channel.label)
})

// State to track selected channel
const selectedChannel = ref(null)

// Example messages for the selected channel
const messages = ref([])

// Select a channel and load its messages
const selectChannel = (channel) => {
  selectedChannel.value = channel
  // Simulating message loading based on channel label
  messages.value = fetchMessagesByChannel(channel.label)
}

// Fetch messages for a selected channel (mock function)
const fetchMessagesByChannel = (channelLabel) => {
  // Mock data for now, replace with actual API call later
  return [
    { id: 1, text: "Hello, everyone!", userId: 1, userName: "Alice" },
    { id: 2, text: "Hi Alice!", userId: currentUser.id, userName: currentUser.name },
    { id: 3, text: "How are you?", userId: 2, userName: "Bob" },
  ]
}

// Computed property to return messages of the selected channel
const selectedChannelMessages = computed(() => {
  return messages.value
})

</script>

<style scoped>
.chat-control {
  padding: 1rem;
  background-color: #f9f9f9;
}

.chat-window {
  max-height: 256px;
  overflow-y: auto;
}
</style>
