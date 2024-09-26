<template>
  <div class="live-chat-window bg-base-300 rounded-2xl p-4 max-h-400">
    <!-- Chat Messages -->
    <div class="chat-messages overflow-y-auto max-h-300">
      <div
        v-for="message in currentChannelMessages"
        :key="message.id"
        class="chat-message"
      >
        <strong>{{ message.sender }}:</strong> {{ message.content }}
      </div>
    </div>

    <!-- Chat Input -->
    <div class="chat-input mt-4">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type your message..."
        @keyup.enter="sendMessage"
      />
    </div>

    <!-- Channel Selector -->
    <div class="channel-selector mt-4">
      <select v-model="selectedChannelId" @change="changeChannel">
        <option
          v-for="channel in channels"
          :key="channel.id"
          :value="channel.id"
        >
          {{ channel.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePitchStore } from '../../../stores/pitchStore'
import { useChannelStore } from '../../../stores/channelStore'

const pitchStore = usePitchStore()
const channelStore = useChannelStore()

// Get the channelId from the selected pitch
const channelId = computed(() => pitchStore.selectedPitch?.channelId || 0)

// Fetch the list of available channels from the store
const channels = computed(() => channelStore.channels)

// State to hold the new message input
const newMessage = ref('')

// Initially set to the channelId of the selected pitch
const selectedChannelId = ref(channelId.value)

// Computed property to get messages for the current channel
const currentChannelMessages = computed(() => {
  const channel = channels.value.find((ch) => ch.id === selectedChannelId.value)
  return channelStore.messages.filter((msg) => msg.channelId === channel?.id)
})

// Function to send a new message
const sendMessage = async () => {
  if (newMessage.value.trim() !== '') {
    await channelStore.sendMessage({
      content: newMessage.value,
      channelId: selectedChannelId.value,
    })
    newMessage.value = '' // Clear the input field after sending
  }
}

// Function to handle channel change
const changeChannel = () => {
  channelStore.setCurrentChannel(selectedChannelId.value)
  channelStore.fetchMessagesByChannelId(selectedChannelId.value) // Fetch messages for the new channel
}

// Watch the channelId from the pitch store and update accordingly
watch(channelId, (newChannelId) => {
  selectedChannelId.value = newChannelId
  channelStore.fetchMessagesByChannelId(newChannelId)
})
</script>
