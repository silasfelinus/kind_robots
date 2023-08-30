<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <form class="flex items-center space-x-4 mb-8" @submit="askQuestion">
      <input
        v-model="question"
        class="flex-1 px-4 py-2 rounded border border-gray-300"
        type="text"
        placeholder="Ask a question..."
      />
      <button class="px-4 py-2 rounded bg-blue-500 text-white">Ask</button>
    </form>
    <div v-for="(message, index) in messages" :key="index" class="mb-4">
      <div
        :class="message.role === 'user' ? 'text-green-600' : 'text-blue-600'"
        class="font-bold mb-1"
      >
        {{ message.role.toUpperCase() }}
      </div>
      <div>{{ message.content }}</div>
    </div>
  </div>
</template>

<script setup>
const question = ref('')
const messages = ref([])

const askQuestion = async () => {
  const userMessage = { content: question.value, role: 'user' }
  messages.value.push(userMessage)
  question.value = ''
  const responses = await createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages.value
  })
  messages.value.push(...responses)
}
</script>

<style scoped>
.container {
  max-width: 700px;
}
</style>
