<template>
  <div class="container rounded-2xl mx-auto p-2 bg-base-200">
    <!-- Message Interaction Area -->
    <div class="message-container bg-base-200 p-1 rounded-2xl">
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
          class="submit-button btn btn-primary mt-2"
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
            v-if="conversation && msg"
            :role="msg.role"
            :content="msg.content ?? ''"
            :avatar-image="msg.avatarImage ?? '/default-image.png'"
            :bot-name="msg.botName ?? 'Kind Robot'"
            :subtitle="msg.subtitle ?? 'No subtitle'"
          />
        </div>

        <!-- Reaction Buttons -->
        <div class="reaction-buttons mt-2 flex space-x-2">
          <!-- Love -->
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'isLoved') }"
            @click="toggleReaction(index, 'isLoved')"
          >
            ❤️
          </button>
          <div
            v-if="showPopup[index]?.isLoved"
            class="popup bg-info text-lg rounded-2xl"
          >
            Favorited <Icon name="heart" />
          </div>

          <!-- Clap -->
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'isClapped') }"
            @click="toggleReaction(index, 'isClapped')"
          >
            👏
          </button>
          <div
            v-if="showPopup[index]?.isClapped"
            class="popup bg-info text-lg rounded-2xl"
          >
            Clapped <Icon name="clap" />
          </div>

          <!-- Boo -->
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'isBooed') }"
            @click="toggleReaction(index, 'isBooed')"
          >
            👎
          </button>
          <div
            v-if="showPopup[index]?.isBooed"
            class="popup bg-info text-lg rounded-2xl"
          >
            Booed <Icon name="boo" />
          </div>

          <!-- Hate -->
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'isHated') }"
            @click="toggleReaction(index, 'isHated')"
          >
            🚫
          </button>
          <div
            v-if="showPopup[index]?.isHated"
            class="popup bg-info text-lg rounded-2xl"
          >
            Hated <Icon name="hate" />
          </div>
        </div>

        <!-- Reply Section -->
        <div
          v-if="
            activeConversationIndex !== null &&
            activeConversationIndex === index
          "
          class="mt-2 flex items-center"
        >
          <textarea
            v-model="replyMessage"
            type="text"
            rows="3"
            placeholder="Continue conversation..."
            class="flex-grow p-2 rounded-md border-2 text-lg resize-y"
            @keyup.enter="continueConversation(index)"
          />
          <button
            class="btn btn-primary ml-2"
            :disabled="isReplyLoading"
            @click="continueConversation(index)"
          >
            Reply
          </button>
          <div
            v-if="isReplyLoading"
            class="loader flex justify-center mt-2 ml-2"
          >
            <ami-butterfly />
          </div>
        </div>

        <!-- Delete Conversation Button -->
        <button
          class="absolute top-2 right-2 text-red-500 hover:text-red-700"
          @click.stop="deleteConversation(index)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { useUserStore } from '../../../stores/userStore'
import { useReactionStore } from '../../../stores/reactionStore'
import { useChatStore, type ChatExchange } from '../../../stores/chatStore'

const shouldShowMilestoneCheck = ref(false)
let userKey: string | null = null
const reactionStore = useReactionStore()

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

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
const replyMessage = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const isReplyLoading = ref(false)

const userId = computed(() => userStore.userId || 0)
const botId = computed(() => botStore.currentBot?.id || 0)
const botName = computed(() => botStore.currentBot?.name || '')
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

type ReactionType = 'isLoved' | 'isClapped' | 'isBooed' | 'isHated'

// Fetch the reaction by chat exchange ID and check if a reaction is active
const isReactionActive = (index: number, reactionType: ReactionType) => {
  const exchangeId = chatStore.getExchangeById(index)?.id
  if (!exchangeId) return false // Safely handle undefined exchange ID

  const reaction = reactionStore.getReactionByChatExchangeId(exchangeId)
  return reaction ? reaction[reactionType] : false
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
    chatStore.addOrUpdateExchange(lastExchange)
  }
})

const sendMessage = async () => {
  isLoading.value = true
  try {
    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${message.value}`
      : message.value
    shouldShowMilestoneCheck.value = true

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

    if (!res.ok) throw new Error('Failed to send message')

    const data = await res.json()

    conversations.value.push([
      {
        role: 'user',
        content: message.value,
        avatarImage: userStore.user?.avatarImage ?? undefined, // Ensure it's string or undefined
      },
      {
        role: 'assistant',
        content: data.choices[0].message.content,
        avatarImage: currentBot.value?.avatarImage ?? undefined, // Ensure it's string or undefined
        botName: currentBot.value?.name ?? 'Kind Robot',
        subtitle: currentBot.value?.subtitle ?? undefined, // Ensure it's string or undefined
      },
    ])

    message.value = ''
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const continueConversation = async (index: number) => {
  isReplyLoading.value = true
  try {
    const sanitizedMessages = conversations.value[index].map((msg) => ({
      ...msg,
    }))

    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${replyMessage.value}`
      : replyMessage.value

    sanitizedMessages.push({ role: 'user', content: fullMessage })

    const res = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: sanitizedMessages,
        stream: false,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to continue conversation')
    }

    const data = await res.json()

    conversations.value[index].push({
      role: 'user',
      content: replyMessage.value,
    })
    conversations.value[index].push({
      role: 'assistant',
      content: data.choices[0].message.content,
    })
    replyMessage.value = ''
  } catch (err) {
    console.error(err)
  } finally {
    isReplyLoading.value = false
  }
}

const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1)
  activeConversationIndex.value = null
}

const toggleReaction = async (index: number, reactionType: ReactionType) => {
  const exchangeId = chatStore.getExchangeById(index)?.id
  if (!exchangeId) return

  const res = await fetch('/api/reactions/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      chatExchangeId: exchangeId,
      reactionType,
    }),
  })

  if (res.ok) {
    showPopup.value[index] = { [reactionType]: true }

    // Hide popup after 2 seconds
    setTimeout(() => {
      showPopup.value[index][reactionType] = false
    }, 2000)
  }
}
</script>
