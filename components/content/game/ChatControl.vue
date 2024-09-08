<template>
  <div class="chat-control bg-base-200 rounded-2xl p-4 border max-w-full flex flex-col space-y-4">
    <!-- Channel Tabs -->
    <div class="font-semibold mb-2 text-lg text-primary">Channels:</div>
    <div class="flex flex-wrap gap-2 mb-4">
      <div 
        v-for="channel in nonNullChannels" 
        :key="channel.label" 
        @click="selectChannel(channel)"
        :class="['cursor-pointer px-4 py-2 rounded-full text-sm transition-colors',
                  selectedChannel?.label === channel.label 
                  ? 'bg-primary text-white shadow' 
                  : 'bg-accent text-base-content hover:bg-primary hover:text-white']"
      >
        {{ channel.label }}
      </div>
    </div>

    <!-- Chat Window -->
    <div v-if="selectedChannel" class="chat-window bg-base-100 rounded-2xl p-4 max-h-96 overflow-y-auto border border-accent flex-1">
      <div v-if="selectedChannelMessages.length === 0" class="text-gray-500 text-center">
        No messages yet for this channel.
      </div>

      <div v-for="message in selectedChannelMessages" :key="message.id" 
           :class="[
             'p-3 mb-2 rounded-lg text-sm shadow',
             message.userId === currentUser.id 
             ? 'bg-primary-light text-white self-end' 
             : 'bg-secondary text-secondary-content'
           ]"
           :style="message.userId === currentUser.id ? 'align-self: flex-end;' : ''">
        <strong>{{ message.userName }}:</strong> {{ message.text }}
      </div>
    </div>

    <!-- Send Message Section -->
    <div v-if="selectedChannel" class="flex items-center gap-2 mt-4">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type your message..."
        class="input input-bordered flex-1"
      />
      <button 
        class="btn btn-accent"
        @click="sendMessage"
        :disabled="!newMessage"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useChannelStore } from '@/stores/channelStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore } from '@/stores/errorStore'

const channelStore = useChannelStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const currentUser = userStore.user
const selectedChannel = ref(null)
const newMessage = ref('')

// Computed property to filter non-null channels
const nonNullChannels = computed(() => {
  return channelStore.channels.filter(channel => channel.label)
})

// Fetch messages when a channel is selected
const selectedChannelMessages = computed(() => {
  return selectedChannel.value ? channelStore.messages.filter(message => message.channelId === selectedChannel.value.id) : []
})

// Select a channel and load its messages from the store
const selectChannel = async (channel) => {
  selectedChannel.value = channel
  try {
    // Fetch the messages for the selected channel from the backend if necessary
    await channelStore.fetchMessagesByChannelId(channel.id)
  } catch (error) {
    errorStore.setError('Failed to load messages for the channel.')
  }
}

// Send a new message
const sendMessage = async () => {
  if (newMessage.value && selectedChannel.value) {
    try {
      // Assuming sendMessage API is present in channelStore
      await channelStore.sendMessage({
        channelId: selectedChannel.value.id,
        text: newMessage.value,
        userId: currentUser.id,
        userName: currentUser.name
      })
      newMessage.value = ''
    } catch (error) {
      errorStore.setError('Failed to send message.')
    }
  }
}

// Fetch initial channels on mount
onMounted(async () => {
  try {
    await channelStore.fetchChannels()
  } catch (error) {
    errorStore.setError('Failed to load channels.')
  }
})
</script>

<style scoped>
.chat-control {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-window {
  max-height: 384px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-window > div {
  align-self: flex-start;
}

input[type="text"] {
  border-radius: 9999px;
}
</style>
