<template>
  <div>
    <!-- Conversations Display -->
    <div
      v-for="(conversation, index) in conversations"
      :key="index"
      class="response-container m-2 p-3 bg-white rounded-lg shadow-md relative"
    >
      <div
        v-for="(msg, msgIndex) in conversation"
        :key="msgIndex"
        class="message-content"
      >
        <ResponseEntry
          v-if="conversation && msg"
          :role="msg.role"
          :content="msg.content ?? ''"
          :avatar-image="msg.avatarImage ?? '/default-image.png'"
          :bot-name="msg.botName ?? 'Kind Robot'"
          :subtitle="msg.subtitle ?? 'No subtitle'"
        />
      </div>

      <!-- Reactions and Reply Section -->
      <div class="reaction-reply flex justify-between items-center mt-1">
        <!-- Reaction Buttons -->
        <div class="reaction-buttons flex space-x-2">
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'LOVED') }"
            @click="toggleReaction(index, ReactionTypeEnum.LOVED)"
          >
            ❤️
          </button>
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'CLAPPED') }"
            @click="toggleReaction(index, ReactionTypeEnum.CLAPPED)"
          >
            👏
          </button>
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'BOOED') }"
            @click="toggleReaction(index, ReactionTypeEnum.BOOED)"
          >
            👎
          </button>
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'HATED') }"
            @click="toggleReaction(index, ReactionTypeEnum.HATED)"
          >
            🚫
          </button>
        </div>

        <!-- Reply Section -->
        <div
          v-if="
            activeConversationIndex !== null &&
            activeConversationIndex === index
          "
          class="reply-section flex items-center"
        >
          <textarea
            v-model="replyMessage"
            rows="2"
            class="p-1 text-sm rounded-md border-2 resize-none"
            placeholder="Reply..."
          />
          <!-- In the reply section -->
          <button
            class="btn btn-primary text-sm ml-1"
            :disabled="isReplyLoading"
            @click="emit('continueConversation', index)"
          >
            Reply
          </button>

          <div v-if="isReplyLoading" class="ml-2"><ami-butterfly /></div>
        </div>
      </div>

      <!-- Delete Conversation Button -->
      <button
        class="absolute top-1 right-1 text-red-500 hover:text-red-700"
        @click.stop="deleteConversation(index)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { useUserStore } from '../../../stores/userStore'
import {
  useReactionStore,
  type ReactionTypeEnum,
} from '../../../stores/reactionStore'
import { useChatStore, type ChatExchange } from '../../../stores/chatStore'

const reactionStore = useReactionStore()
const botName = computed(() => botStore.currentBot?.name || '')
const emit = defineEmits(['continueConversation'])

interface Message {
  role: 'user' | 'assistant'
  content: string
  avatarImage?: string
  botName?: string
  subtitle?: string
}

const conversations = ref<Message[][]>([])
const activeConversationIndex = ref<number | null>(null)
const botStore = useBotStore()
const userStore = useUserStore()
const chatStore = useChatStore()
const replyMessage = ref('')
const isReplyLoading = ref(false)

const userId = computed(() => userStore.userId || 10)
const botId = computed(() => botStore.currentBot?.id || 1)
const username = computed(() => userStore.username)
const showPopup = ref<{ [key: number]: { [key: string]: boolean } }>({})

// Function to convert a conversation to ChatExchange
function convertToChatExchange(
  conversation: Message[],
  userId: number,
  botId: number,
  botName: string,
  username: string,
): ChatExchange {
  const userPrompt =
    conversation.find((msg) => msg.role === 'user')?.content ?? ''
  const botResponse =
    conversation.find((msg) => msg.role === 'assistant')?.content ?? ''

  return {
    id: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    botId,
    botName,
    userId,
    username,
    userPrompt,
    botResponse,
    isPublic: false,
    previousEntryId: 0,
  }
}

// Fetch the reaction by chat exchange ID and check if a reaction is active
const isReactionActive = (index: number, reactionType: ReactionType) => {
  const exchangeId = chatStore.getExchangeById(index)?.id
  if (!exchangeId) return false // Safely handle undefined exchange ID

  const reaction = reactionStore.getReactionByChatExchangeId(exchangeId)
  return reaction ? reaction.reactionType === reactionType : false
}

watchEffect(() => {
  if (conversations.value.length > 0) {
    const lastConversation = conversations.value[conversations.value.length - 1]
    const lastExchange = convertToChatExchange(
      lastConversation,
      userId.value,
      botId.value,
      botName.value,
      username.value,
    )
    chatStore.addOrUpdateExchange(lastExchange, userId.value, botId.value)
  }
})

const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1)
  activeConversationIndex.value = null
}

const toggleReaction = async (
  index: number,
  reactionType: ReactionTypeEnum,
) => {
  const exchangeId = chatStore.getExchangeById(index)?.id
  const userId = userStore.user?.id
  if (!exchangeId || !userId) return

  // Check if there's an existing reaction for this chat exchange
  const existingReaction = reactionStore.getReactionByChatExchangeId(exchangeId)

  try {
    if (existingReaction) {
      // If the reaction exists, update it with the new reactionType
      await reactionStore.updateReaction(existingReaction.id, {
        reactionType,
      })
    } else {
      // Otherwise, create a new reaction
      await reactionStore.createReaction({
        chatExchangeId: exchangeId,
        userId,
        reactionType,
        reactionCategory: ReactionCategoryEnum.CHANNEL, // Adjust as per your use case
      })
    }

    // Show a temporary popup for the reaction
    showPopup.value[index] = { [reactionType]: true }
    setTimeout(() => {
      showPopup.value[index][reactionType] = false
    }, 2000)
  } catch (error) {
    console.error('Failed to toggle reaction:', error)
  }
}
</script>
