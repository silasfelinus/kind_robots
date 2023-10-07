<template>
  <div class="live-chat-window bg-base-200 rounded-2xl p-4 max-h-400">
    <!-- Chat Messages -->
    <div class="chat-messages overflow-y-auto max-h-300">
      <div v-for="message in currentChannelMessages" :key="message.id" class="chat-message">
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
        <option v-for="channel in channels" :key="channel.id" :value="channel.id">
          {{ channel.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useChannelStore, Channel as BaseChannel, Message } from '@/stores/channelStore'

interface Channel extends BaseChannel {
  messages?: Message[]
}

const pitchStore = usePitchStore()
const channelStore = useChannelStore()

const channelId = computed(() => pitchStore.selectedPitch?.channelId || 0)
const channels = computed<Channel[]>(() => channelStore.channels)
const newMessage = ref('') // Holds the new message to be sent
const selectedChannelId = ref(channelId.value) // Initially set to the channelId of the selected pitch

const currentChannelMessages = computed<Message[]>(() => {
  console.log('Type:', typeof channels.value, 'Value:', channels.value) // Debugging line
  const channel = channels.value.find((ch) => ch.id === selectedChannelId.value)
  return channel?.messages || []
})

// Function to send a new message
const sendMessage = () => {
  if (newMessage.value.trim() !== '') {
    const channel = Array.isArray(channels.value)
      ? channels.value.find((ch) => ch.id === selectedChannelId.value)
      : null

    if (channel) {
      channelStore.createMessage({
        sender: 'user',
        recipient: 'recipient',
        channelId: selectedChannelId.value,
        content: newMessage.value,
        userId: 0
      })
      newMessage.value = ''
    }
  }
}

// Function to change the channel
const changeChannel = () => {
  channelStore.setCurrentChannel(selectedChannelId.value)
  channelStore.fetchCurrentChannelWithMessages(selectedChannelId.value)
}

watch(channelId, (newChannelId) => {
  selectedChannelId.value = newChannelId
  channelStore.fetchCurrentChannelWithMessages(newChannelId)

  console.log('Type:', typeof channels.value, 'Value:', channels.value)
})
</script>
