<template>
  <div>
    <!-- Display channels (comments) associated with the component -->
    <div v-if="channels.length === 0" class="text-center p-4 text-gray-500">
      No comments available for this component yet.
    </div>

    <div
      v-for="channel in channels"
      :key="channel.id"
      class="mb-4 p-4 border border-gray-300 rounded-lg bg-white shadow-md"
    >
      <h2 class="text-lg font-bold">{{ channel.title }}</h2>
      <p class="text-gray-700 mb-4">{{ channel.description }}</p>

      <!-- Display messages for each channel -->
      <div
        v-if="!messages[channel.id] || messages[channel.id].length === 0"
        class="text-center p-4 text-gray-500"
      >
        No messages in this channel yet.
      </div>
      <ul v-else>
        <li
          v-for="message in messages[channel.id]"
          :key="message.id"
          class="p-2 border-b border-gray-200"
        >
          {{ message.content }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  useChannelStore,
  type Channel,
  type Message,
} from './../../../stores/channelStore'

// Props
const props = defineProps({
  componentId: {
    type: Number,
    required: true,
  },
})

// Pinia store
const channelStore = useChannelStore()

// State to hold channels and messages
const channels = ref<Channel[]>([])
const messages = ref<{ [key: number]: Message[] }>({})

// Fetch channels and their messages when the componentId changes
watch(
  () => props.componentId,
  async (newId) => {
    if (newId) {
      try {
        // Fetch channels for the component
        await channelStore.fetchChannelByComponentId(newId)
        channels.value = channelStore.getChannelsForComponent(newId)

        // Fetch messages for each channel
        for (const channel of channels.value) {
          await channelStore.fetchMessagesByChannelId(channel.id)
          messages.value[channel.id] = channelStore.getMessagesForChannel(
            channel.id,
          )
        }
      } catch (error) {
        console.error('Error fetching channels or messages:', error)
      }
    }
  },
)
</script>

<style scoped>
/* Add necessary styles */
</style>
