<template>
  <div class="chatbox flex flex-col h-full">
    <div class="chatbox__messages flex-grow overflow-y-auto mb-4">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message my-2 mx-4"
        :class="{
          'message--bot': message.userId === bot.id,
          'message--user': message.userId === me.id,
        }"
      >
        <div class="message__user text-xs text-gray-600">
          {{ getUser(message.userId).name }}
        </div>
        <div
          class="message__text px-4 py-2 rounded-lg shadow-md"
          :class="{
            'bg-blue-500 text-white': message.userId === me.id,
            'bg-gray-200 text-gray-800': message.userId === bot.id,
          }"
        >
          {{ message.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Message, User } from "@/types";
import { useChatAi } from "@/composables/useChatAi";
import { useAppStore } from "@/store";

const store = useAppStore();
const { messages, addMessage } = store;

const me = ref<User>({
  id: "user",
  avatar: "/avatar2.png",
  name: "You",
});

const bot = computed(() => ({
  id: "assistant",
  avatar: store.selectedAgent.value?.avatarUrl ?? "/cassandra5.png",
  name: store.selectedAgent.value?.name ?? "A.M.I.",
}));

const users = computed(() => [me.value, bot.value]);

const chatAi = useChatAi();

async function handleNewMessage(text: string) {
  const message: Message = {
    id: Date.now().toString(),
    userId: me.value.id,
    createdAt: new Date(),
    text,
  };

  addMessage(message);

  const res = await chatAi.chat({
    messages: messages.value.map((m) => ({
      role: m.userId,
      content: m.text,
    })),
  });

  if (!chatAi.firstMessage.value) return;

  const msg = {
    id: res?.id ?? "",
    userId: bot.value.id,
    createdAt: new Date(),
    text: chatAi.firstMessage.value.content,
  };
  addMessage(msg);
}

function getUser(userId: string): User {
  return users.value.find((user) => user.id === userId) ?? me.value;
}
</script>
<style scoped>
.chatbox {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chatbox__messages {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.message {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-left: 1rem;
  margin-right: 1rem;
}

.message__user {
  font-size: 0.75rem;
  color: #4b5563;
}

.message--bot .message__user {
  text-align: left;
}

.message--user .message__user {
  text-align: right;
}

.message__text {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.message--bot .message__text {
  background-color: #e5e7eb;
  color: #1f2937;
}

.message--user .message__text {
  background-color: #3b82f6;
  color: #ffffff;
}
</style>