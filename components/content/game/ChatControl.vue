<template>
  <div
    class="chat-control bg-base-300 rounded-2xl p-4 border max-w-full flex flex-col space-y-4 mb-48"
  >
    <div class="font-semibold mb-2 text-lg text-primary">Select a Channel:</div>
    <div class="mb-4">
      <select
        v-model="selectedChannel"
        class="select select-bordered w-full bg-accent text-base-content rounded-lg"
        @change="handleChannelChange"
      >
        <option disabled value="">Choose a channel</option>
        <option
          v-for="channel in nonNullChannels"
          :key="channel.id"
          :value="channel"
        >
          {{ channel.label }}
        </option>
      </select>
    </div>

    <div class="flex flex-col md:flex-row gap-4 flex-1">
      <div
        v-if="selectedChannel"
        class="chat-window bg-base-300 rounded-2xl p-4 max-h-96 overflow-y-auto border border-accent flex-1"
      >
        <div
          v-if="selectedChannelMessages.length === 0"
          class="text-gray-500 text-center"
        >
          No messages yet for this channel.
        </div>

        <div
          v-for="message in selectedChannelMessages"
          :key="message.id"
          :class="[
            'p-3 mb-2 rounded-lg text-sm shadow',
            message.userId === currentUser.value?.id
              ? 'bg-primary-light text-white self-end'
              : 'bg-secondary text-secondary-content',
          ]"
        >
          <strong>{{ message.sender || 'Unknown User' }}:</strong>
          {{ message.content }}
        </div>
      </div>

      <div
        v-if="selectedChannel"
        class="flex flex-col items-center gap-2 mt-4 w-full md:w-1/3"
      >
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type your message..."
          class="input input-bordered w-full flex-1 rounded-lg"
        />
        <button
          class="btn btn-accent w-full"
          :disabled="!newMessage"
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useChannelStore } from '@/stores/channelStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { User } from '@prisma/client' // Ensure User type is imported

const channelStore = useChannelStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const currentUser = ref<User | null>(userStore.user) // Ensure correct type
const selectedChannel = ref<Channel | null>(null)
const newMessage = ref('')

// Computed property to filter non-null channels
const nonNullChannels = computed(() => {
  return channelStore.channels.filter((channel) => channel.label)
})

// Fetch messages for the selected channel
const selectedChannelMessages = computed(() => {
  return selectedChannel.value
    ? channelStore.messages.filter(
        (message) => message.channelId === selectedChannel.value.id,
      )
    : []
})

// Handle the change event from the dropdown
const handleChannelChange = async () => {
  if (selectedChannel.value) {
    try {
      await channelStore.fetchMessagesByChannelId(selectedChannel.value.id)
    } catch (error) {
      errorStore.setError(
        ErrorType.VALIDATION_ERROR,
        'Failed to load messages for the channel. ' + error,
      )
    }
  }
}

const sendMessage = async () => {
  if (newMessage.value && selectedChannel.value) {
    try {
      await channelStore.sendMessage({
        channelId: selectedChannel.value.id,
        content: newMessage.value,
        userId: currentUser.value ? currentUser.value.id : 10, // Default userId to 10 if currentUser is null
        sender: currentUser.value ? currentUser.value.name : 'Anonymous',
      })
      newMessage.value = ''
    } catch (error) {
      errorStore.setError(
        ErrorType.VALIDATION_ERROR,
        'Failed to send message. ' + error,
      )
    }
  }
}

// Fetch initial channels on mount
onMounted(async () => {
  try {
    await channelStore.fetchChannels() // Ensure this method exists
  } catch (error) {
    errorStore.setError(
      ErrorType.VALIDATION_ERROR,
      'Failed to load channels. ' + error,
    )
  }
})
</script>

<style scoped>
.chat-control {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 12rem; /* mb-48 */
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

input[type='text'] {
  border-radius: 9999px;
}
</style>
