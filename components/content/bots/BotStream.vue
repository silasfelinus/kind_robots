<template>
  <div class="container rounded-2xl mx-auto p-2">
    <!-- Message Interaction Area -->
    <div class="message-container bg-primary p-1 border rounded-2xl">
      <!-- New Message Prompt -->
      <div class="prompt-area p-2 rounded-2xl">
        <label for="newMessage" class="block mb-2 font-bold">
          <div v-if="currentBot" class="user-intro p-2 rounded-2xl m-2">
            <p class="text-lg">{{ currentBot.userIntro ?? 'User Intro' }}</p>
          </div>
        </label>
        <textarea
          id="newMessage"
          v-model="message"
          rows="5"
          class="message-input w-full p-2 rounded-md border-2 resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        />
        <button
          class="submit-button btn btn-accent border border-base-200 rounded-2xl mt-2"
          :disabled="isLoading"
          @click="sendMessage"
        >
          Send Message
        </button>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>

      <!-- Conversations -->
      <div
        v-for="(conversation, index) in conversations"
        :key="index"
        class="response-container m-2 p-4 bg-white rounded-md shadow-md relative flex flex-col items-start"
      >
        <div
          v-for="(msg, msgIndex) in conversation"
          :key="msgIndex"
          :class="{ 'flex-row-reverse': msg.role === 'user' }"
          class="flex items-center message-content"
        >
          <ResponseEntry
            :role="msg.role"
            :content="msg.content ?? ''"
            :avatar-image="msg.avatarImage ?? '/images/default-avatar.webp'"
            :bot-name="msg.botName ?? 'Kind Robot'"
            :subtitle="msg.subtitle ?? 'Your friendly neighborhood AI'"
          />
        </div>

        <!-- Reaction Buttons -->
        <div class="reaction-buttons mt-2 flex space-x-2">
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'LOVED') }"
            @click="toggleReaction(index, 'LOVED')"
          >
            ❤️
          </button>
          <div
            v-if="showPopup[index]?.LOVED"
            class="popup bg-info text-lg rounded-2xl"
          >
            Favorited <Icon name="heart" />
          </div>

          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'HATED') }"
            @click="toggleReaction(index, 'HATED')"
          >
            👎
          </button>
          <div
            v-if="showPopup[index]?.HATED"
            class="popup bg-info text-lg rounded-2xl"
          >
            Disliked <Icon name="thumb-down" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { useUserStore } from '../../../stores/userStore'
import { useReactionStore } from '../../../stores/reactionStore'
import type { ReactionType } from '@prisma/client'

let userKey: string | null = null

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  avatarImage?: string | null
  botName?: string | null
  subtitle?: string | null
}

const conversations = ref<Message[][]>([])
const botStore = useBotStore()
const userStore = useUserStore()
const reactionStore = useReactionStore()

const currentBot = computed(() => {
  return (
    botStore.currentBot ?? {
      name: 'Unknown Bot',
      subtitle: 'No subtitle available',
      description: 'No description available',
      userIntro: 'Hi Bot',
      prompt: 'I am a kind robot',
      avatarImage: '/images/amibotsquare1.webp',
    }
  )
})

const message = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const userId = computed(() => userStore.userId) // Default to 10 if userId is undefined

const showPopup = ref<{ [key: number]: { [key: string]: boolean } }>({})

const isReactionActive = (index: number, reactionType: ReactionType) => {
  const conversationId = conversations.value[index]?.[0]?.id ?? 0

  const reaction = reactionStore.getUserReactionForComponent(
    conversationId,
    userId.value,
  )

  return reaction?.reactionType === reactionType // Compare reactionType directly
}

const toggleReaction = async (index: number, reactionType: ReactionType) => {
  const conversation = conversations.value[index]
  const conversationId = conversation?.[0]?.id

  // Exit early if no conversationId is found
  if (!conversationId) return

  // Retrieve the existing reaction for the current conversation and user
  const existingReaction = reactionStore.getUserReactionForComponent(
    conversationId,
    userId.value ?? 10, // Ensure userId is a number (default to 10 if undefined)
  )

  // Prepare reaction data ensuring userId is a valid number
  const reactionData: {
    userId: number
    componentId: number
    reactionType: ReactionType // Ensure reactionType is always defined here
    pitchId?: number | null
  } = {
    userId: userId.value ?? 10, // Ensure userId is a number (default to 10)
    componentId: conversationId,
    reactionType, // Ensure reactionType is passed as a required field
    pitchId: existingReaction?.pitchId ?? undefined, // Convert null to undefined
  }

  // Toggle the existing reaction or create a new one
  if (existingReaction) {
    // If the reaction already exists, update its type (if necessary)
    if (existingReaction.reactionType === reactionType) {
      // If the user tries to apply the same reaction, you may want to delete it instead of updating
      await reactionStore.deleteReaction(existingReaction.id)
    } else {
      await reactionStore.updateReaction(existingReaction.id, reactionData)
    }
  } else {
    // Create new reaction if it doesn't exist
    await reactionStore.createReaction(reactionData)
  }

  // Show popup for the reaction
  showPopup.value[index] = { ...showPopup.value[index], [reactionType]: true }

  // Hide the popup after 2 seconds
  setTimeout(() => {
    showPopup.value[index][reactionType] = false
  }, 2000)
}

const sendMessage = async () => {
  isLoading.value = true
  error.value = null

  try {
    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${message.value}`
      : message.value

    const res = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: fullMessage }],
        stream: false,
        user_openai_key: userKey,
      }),
    })

    if (!res.ok) throw new Error(`Error: ${res.statusText}`)

    const data = await res.json()

    conversations.value.push([
      {
        role: 'user',
        content: message.value,
        avatarImage: userStore.user?.avatarImage ?? undefined,
      },
      {
        role: 'assistant',
        content: data.choices[0].message.content,
        avatarImage: currentBot.value?.avatarImage,
        botName: currentBot.value?.name,
        subtitle: currentBot.value?.subtitle,
      },
    ])
    message.value = '' // Clear message input
  } catch {
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.popup {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #3b82f6;
  padding: 4px;
  border-radius: 1rem;
  font-size: 1rem;
}

.message-content {
  white-space: pre-wrap;
}
</style>
