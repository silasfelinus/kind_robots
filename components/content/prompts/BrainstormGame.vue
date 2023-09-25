<template>
  <div class="flex flex-col items-center bg-base-200 rounded-2xl p-2 m-2 border">
    <button
      class="bg-primary text-white p-2 rounded m-2"
      :disabled="isLoading"
      @click="fetchBrainstorm"
    >
      Get New Ideas
    </button>
    <div
      v-if="isLoading"
      class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"
    ></div>
    <div v-for="(idea, index) in ideas" :key="index" class="my-4">
      <BrainstormCard :idea="idea" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const ideas = ref([])
const isLoading = ref(false)

const fetchBrainstorm = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/api/botcafe/brainstorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'five more original brainstorms' }]
      })
    })

    const data = await response.json()
    const rawContent = data.choices[0].message.content
    const splitContent = rawContent.split('\n\n').slice(1, -1) // Remove intro and outro

    ideas.value = splitContent.map((item) => {
      const [title, example] = item.split(' - ')
      return { title, example }
    })
  } catch (error) {
    console.error('Error fetching brainstorm:', error)
  } finally {
    isLoading.value = false
  }
}

fetchBrainstorm() // Fetch ideas on page load
</script>

<style scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
