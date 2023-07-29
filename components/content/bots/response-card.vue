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
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  role: string
  content: string
}

const props = defineProps({
  messages: {
    type: Array as () => Message[],
    default: () => []
  },
  sendMessage: {
    type: Function as unknown as () => (updatedMessages: Message[]) => Promise<void>,
    default: () => async () => {}
  }
})

let showReply = ref(false)
let replyMessage = ref('')

const toggleReply = () => {
  showReply.value = !showReply.value
}

const sendReply = async () => {
  try {
    const updatedMessages = [...props.messages, { role: 'user', content: replyMessage.value }]
    await props.sendMessage(updatedMessages)
    replyMessage.value = ''
    showReply.value = false
  } catch (err) {
    console.error(err)
  }
}
</script>
