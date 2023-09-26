<template>
  <div class="flex flex-col items-center bg-base-200 rounded-2xl p-8 m-8 border">
    <h1 class="text-3xl font-bold mb-4">Brainstorm Café</h1>
    <img :src="pageImage" alt="Brainstorming" class="rounded-full h-40 w-40 mb-4" />
    <p class="text-lg mb-4">
      Welcome to the Brainstorm Café! Click the button below to get some fresh, creative ideas.
    </p>
    <button
      class="bg-primary text-white p-4 rounded-full text-lg m-4"
      :disabled="isLoading"
      @click="fetchBrainstorm"
    >
      Get New Ideas
    </button>
    <div
      v-if="isLoading"
      class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"
    ></div>
    <transition-group name="list" tag="div" class="flex flex-wrap justify-center">
      <div v-for="idea in allIdeas" :key="idea.title" class="m-4 w-1/4">
        <BrainstormCard :idea="idea" @click="handleCardClick(idea)" />
      </div>
    </transition-group>
    <div v-if="errorMessage" class="text-red-500">
      {{ errorMessage }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { errorHandler } from '../../../server/api/utils/error'
import { sampleIdeas } from '@/training/sampleIdeas'

interface Idea {
  title: string
  example: string
}

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const pageImage = '/images/avatars/brain1.webp'

const getRandomIdeas = (count: number) => {
  const shuffled = [...sampleIdeas].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
// Initialize allIdeas with 5 random pre-generated ideas
const allIdeas = ref<Idea[]>(getRandomIdeas(5))

// Fetch from API only when the button is clicked, not on mount
const fetchBrainstorm = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const response = await fetch('https://kindrobots.org/api/botcafe/brainstorm', {
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
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const newIdeas: Idea[] = parseIdeasFromAPI(data.choices[0].message.content)
      allIdeas.value = [...newIdeas, ...allIdeas.value]
    } else {
      throw new Error('Invalid API response')
    }
  } catch (error: any) {
    errorMessage.value = errorHandler(error).message
    console.error('Error fetching brainstorm:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCardClick = (idea: Idea) => {
  console.log('Card clicked:', idea)
}

const parseIdeasFromAPI = (rawContent: string) => {
  const lines = rawContent.split('\n')
  const ideasList = lines.filter((line: string) => /^\d+\./.test(line))
  return ideasList.map((item: string) => {
    const cleanItem = item.replace(/^\d+\.\s/, '')
    const [title, example] = cleanItem.split(' - ')
    return { title, example } as Idea
  })
}
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
.list-enter-active,
.list-leave-active {
  transition: all 1s;
}
.list-enter,
.list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
