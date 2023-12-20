<template>
  <div class="container rounded-2xl mx-auto p-2 bg-base-200">
    <!-- Bot Avatar and Details -->
    <div v-if="currentBot" class="avatar-container w-full m-2 rounded-lg">
      <!-- Bot Avatar and Details -->
      <div class="flex-grow rounded-2xl m-2 p-2 border bg-base-200">
        <bot-carousel2 />
        <div class="flex-1 text-center">
          <h1 class="text-3xl font-bold">{{ currentBot.name ?? 'Unknown Bot' }}</h1>
          <p class="text-xl">{{ currentBot.subtitle ?? 'Subtitle' }}</p>
          <div class="card mt-2">{{ currentBot.description ?? 'Description' }}</div>
        </div>
      </div>
    </div>

    <!-- Message Interaction Area -->
    <div class="message-container bg-base-200 p-1 rounded-2xl">
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
        ></textarea>
        <button class="submit-button btn btn-primary mt-2" :disabled="isLoading" @click="sendMessage">
          Send Message
        </button>
        <milestone-reward v-if="shouldShowMilestoneCheck" :id="4"></milestone-reward>
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
            :content="msg.content"
            :avatar-image="msg.avatarImage ?? '/images/kindtitle.webp'"
            :bot-name="msg.botName ?? 'Kind Robot'"
            :subtitle="msg.subtitle ?? 'Your friendly neighborhood AI'"
          />
        </div>
        <!-- Reaction Buttons -->
        <div class="reaction-buttons mt-2 flex space-x-2">
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'liked') }"
            @click="toggleReaction(index, 'liked')"
          >
            👍
          </button>
          <div v-if="showPopup[index]?.liked" class="popup">Response Liked <icon name="like" class="icon-class" /></div>

          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'hated') }"
            @click="toggleReaction(index, 'hated')"
          >
            👎
          </button>
          <div v-if="showPopup[index]?.hated" class="popup">Response hated <icon name="hate" class="icon-class" /></div>
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'loved') }"
            @click="toggleReaction(index, 'loved')"
          >
            ❤️
          </button>
          <div v-if="showPopup[index]?.loved" class="popup">Favorited <icon name="❤️" class="icon-class" /></div>
          <button
            class="hover:bg-gray-200"
            :class="{ 'bg-primary': isReactionActive(index, 'flagged') }"
            @click="toggleReaction(index, 'flagged')"
          >
            🚩
          </button>
          <div v-if="showPopup[index]?.flagged" class="popup">Flagged <icon name="🚩" class="icon-class" /></div>
        </div>
        <div
          v-if="activeConversationIndex !== null && activeConversationIndex === index"
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
          <button class="btn btn-primary ml-2" :disabled="isReplyLoading" @click="continueConversation(index)">
            Reply
          </button>
          <div v-if="isReplyLoading" class="loader flex justify-center mt-2 ml-2">
            <ami-butterfly />
          </div>
        </div>
        <button class="absolute top-2 right-2 text-red-500 hover:text-red-700" @click.stop="deleteConversation(index)">
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useBotStore, type Bot } from '../../../stores/botStore';
import { useUserStore } from '@/stores/userStore';
import { errorHandler } from '@/server/api/utils/error';
import { useChatStore, type ChatExchange } from '@/stores/chatStore';

const shouldShowMilestoneCheck = ref(false);
let userKey: string | null = null;

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key');
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  avatarImage?: string;
  botName?: string;
  subtitle?: string;
}

interface Conversation extends Array<Message> {}
const conversations = ref<Conversation[]>([]);
const activeConversationIndex = ref<number | null>(null);
const botStore = useBotStore();
const userStore = useUserStore();
const chatStore = useChatStore();
const currentBot = computed<Bot | null>(() => botStore.currentBot);
const message = ref('');
const replyMessage = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const userImage = computed(() => userStore.user?.avatarImage);
const isReplyLoading = ref(false);

// Usage
const userId = computed(() => userStore.userId || 0);
const botId = computed(() => botStore.currentBot?.id || 0);
const botName = computed(() => botStore.currentBot?.name || '');
const username = computed(() => userStore.username);
const showPopup = ref<{ [key: number]: { [key: string]: boolean } }>({});

// Function to convert a conversation to ChatExchange

// Function to convert a conversation to ChatExchange
function convertToChatExchange(
  conversation: Message[],
  userId: number,
  botId: number,
  botName: string,
  username: string,
): ChatExchange {
  const userPrompt = conversation.find((msg) => msg.role === 'user')?.content ?? '';
  const botResponse = conversation.find((msg) => msg.role === 'assistant')?.content ?? '';

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
    liked: null,
    hated: null,
    loved: null,
    flagged: null,
    previousEntryId: 0,
  };
}

type ReactionType = 'liked' | 'hated' | 'loved' | 'flagged';

const isReactionActive = (index: number, reactionType: ReactionType) => {
  const currentExchange = chatStore.getExchangeById(index) as ChatExchange;
  return currentExchange?.[reactionType];
};

// Watch for changes in conversations and update ChatExchange
watchEffect(() => {
  if (conversations.value.length > 0) {
    const lastConversation = conversations.value[conversations.value.length - 1];
    const lastExchange = convertToChatExchange(
      lastConversation,
      userId.value,
      botId.value,
      botName.value,
      username.value,
    );
    chatStore.addOrUpdateExchange(lastExchange);
  }
});

const sendMessage = async () => {
  isLoading.value = true;
  try {
    const fullMessage = currentBot.value?.userIntro ? `${currentBot.value.userIntro} ${message.value}` : message.value;
    shouldShowMilestoneCheck.value = true;
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullMessage }],
        stream: false,
        user_openai_key: userKey,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    conversations.value.push([
      {
        role: 'user',
        content: message.value,
        avatarImage: userStore.user?.avatarImage ?? undefined,
      },

      {
        role: 'assistant',
        content: res.data.choices[0].message.content,
        avatarImage: currentBot.value?.avatarImage,
        botName: currentBot.value?.name,
        subtitle: currentBot.value?.subtitle,
      },
    ]);
    message.value = '';
  } catch (err) {
    console.error(err);
    error.value = 'Failed to send the message. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const toggleReaction = (index: number, reactionType: 'liked' | 'hated' | 'loved' | 'flagged') => {
  const currentExchange = convertToChatExchange(
    conversations.value[index],
    userId.value,
    botId.value,
    botName.value,
    username.value,
  );
  if (currentExchange && currentExchange.id) {
    // Check for id
    const currentReactionState = currentExchange[reactionType] ?? false;
    chatStore.addReaction(currentExchange.id, { [reactionType]: !currentReactionState });
  }
  // Show popup
  if (!showPopup.value[index]) {
    showPopup.value[index] = {};
  }
  showPopup.value[index][reactionType] = true;

  // Hide popup after 2 seconds
  setTimeout(() => {
    showPopup.value[index][reactionType] = false;
  }, 2000);
};

const continueConversation = async (index: number) => {
  isReplyLoading.value = true;
  try {
    // Remove unexpected properties from each message
    const sanitizedMessages = conversations.value[index].map(({ avatarImage, botName, subtitle, ...rest }) => rest);

    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${replyMessage.value}`
      : replyMessage.value;

    // Add the new user message
    sanitizedMessages.push({ role: 'user', content: fullMessage });

    const res = await axios.post('/api/botcafe/chat', {
      model: 'gpt-3.5-turbo',
      messages: sanitizedMessages,
      stream: false,
    });
    conversations.value[index].push({ role: 'user', content: replyMessage.value });
    conversations.value[index].push({
      role: 'assistant',
      content: res.data.choices[0].message.content,
    });
    replyMessage.value = '';
  } catch (err) {
    console.error(err);
  }
  isReplyLoading.value = false;
};
watchEffect(() => {
  if (conversations.value.length > 0) {
    const lastConversation = conversations.value[conversations.value.length - 1];
    const lastExchange = convertToChatExchange(
      lastConversation,
      userId.value,
      botId.value,
      botName.value,
      username.value,
    );
    chatStore.addOrUpdateExchange(lastExchange);
  }
});

watchEffect(() => {
  if (currentBot.value && currentBot.value.prompt) {
    message.value = currentBot.value.prompt;
  }
});
const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1);
  activeConversationIndex.value = null; // Reset the active conversation index after deletion
};
</script>
<style>
.popup {
  position: absolute;
  top: 0;
  right: 0;
  background-color: bg-info;
  padding: 4px;
  border-radius: rounded-2xl;
  font-size: text-lg;
}

.message-content {
  white-space: pre-wrap; /* This will preserve newlines and spaces */
}
</style>
