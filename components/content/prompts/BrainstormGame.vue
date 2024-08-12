<!-- eslint-disable vue/html-self-closing -->
<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-2 m-2 border"
  >
    <h1 class="text-3xl font-bold mb-4">Brainstorm Café</h1>
    <img
      :src="pageImage"
      alt="Brainstorming"
      class="rounded-full h-40 w-40 mb-4"
    />
    <p class="text-lg mb-4">
      Welcome to the Brainstorm Café! Click the button below to get some fresh,
      creative ideas.
    </p>
    <button
      class="bg-primary text-white p-4 rounded-full text-lg m-4"
      :disabled="isLoading"
      @click="fetchBrainstorm"
    >
      Get New Ideas
    </button>
    <milestone-reward v-if="shouldShowMilestoneCheck" :id="2" />
    <div
      v-if="isLoading"
      class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"
    />
    <transition-group
      name="list"
      tag="div"
      class="flex flex-wrap justify-center"
    >
      <div v-for="idea in allIdeas" :key="idea.title" class="m-2">
        <BrainstormCard :idea="idea" @click="handleCardClick(idea)" />
      </div>
    </transition-group>
    <div v-if="errorMessage" class="bg-warning text-white p-4 rounded-full">
      <icon name="error" class="text-lg" /> {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useErrorStore } from '@/stores/errorStore'
import { sampleIdeas } from '@/training/sampleIdeas'

interface Idea {
  title: string
  example: string
}

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const pageImage = '/images/avatars/brain1.webp'
const shouldShowMilestoneCheck = ref(false)

const getRandomIdeas = (count: number) => {
  const shuffled = [...sampleIdeas].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
// Initialize allIdeas with 5 random pre-generated ideas
const allIdeas = ref<Idea[]>(getRandomIdeas(5))

const errorStore = useErrorStore()

const fetchBrainstorm = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    // Use handleError to manage errors centrally
    await errorStore.handleError(
      async () => {
        const response = await fetch('/api/botcafe/brainstorm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: 'five more original brainstorms' },
            ],
          }),
        })

        shouldShowMilestoneCheck.value = true

        const data = await response.json()
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const newIdeas: Idea[] = parseIdeasFromAPI(
            data.choices[0].message.content,
          )
          if (newIdeas.length > 0) {
            allIdeas.value = [...newIdeas, ...allIdeas.value]
          } else {
            throw new Error('No new ideas generated')
          }
        } else {
          throw new Error('Invalid API response')
        }
      },
      'GENERAL_ERROR' as ErrorType,
      'Failed to fetch new brainstorming ideas. Please try again.',
    )
  } catch (error) {
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

.card-style {
  background-color: var(--bg-secondary);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
}

.card-style:hover {
  transform: translateY(-10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
