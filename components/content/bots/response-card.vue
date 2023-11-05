<template>
  <div class="response-card">
    <div class="message">
      {{ messages && messages.length ? messages[messages.length - 1].content : '' }}
    </div>
    <div class="actions">
      <button class="action-button save">Save</button>
      <button class="action-button share-facebook">Share on Facebook</button>
      <button class="action-button share-twitter">Share on Twitter</button>
      <button class="action-button thumbs-up">👍</button>
      <button class="action-button thumbs-down">👎</button>
      <button class="action-button delete">X</button>
      <button class="action-button reply" @click="toggleReply">Reply</button>
    </div>
    <div v-if="showReply" class="reply-container">
      <textarea v-model="replyMessage" placeholder="Type your reply here..."></textarea>
      <button @click="sendReply">Send Reply</button>
    </div>
    <div class="message">
      {{ getLastMessageContent }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

interface Message {
  role: string;
  content: string;
}

const props = defineProps({
  messages: {
    type: Array as () => Message[],
    default: () => [],
  },
  sendMessage: {
    type: Function as unknown as () => (updatedMessages: Message[]) => Promise<void>,
    default: () => async () => {},
  },
});

let showReply = ref(false);
let replyMessage = ref('');

const toggleReply = () => {
  showReply.value = !showReply.value;
};

const getLastMessageContent = computed(() => {
  return props.messages.length ? props.messages[props.messages.length - 1].content : '';
});
const sendReply = async () => {
  try {
    const updatedMessages = [...props.messages, { role: 'user', content: replyMessage.value }];
    await props.sendMessage(updatedMessages);
    replyMessage.value = '';
    showReply.value = false;
  } catch (err) {
    console.error(err);
  }
};
</script>
<style scoped>
.response-card {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message {
  font-size: 16px;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button:hover {
  background-color: #eaeaea;
}

.reply-container {
  margin-top: 16px;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}
</style>
