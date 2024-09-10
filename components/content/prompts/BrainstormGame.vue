<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-4 m-4 border border-primary shadow-lg"
  >
    <h1 class="text-3xl font-bold mb-4 text-primary">Brainstorm Café</h1>
    <img
      :src="pageImage"
      alt="Brainstorming"
      class="rounded-full h-40 w-40 mb-4 border-4 border-primary shadow"
    />
    <p class="text-lg text-secondary mb-6">
      Welcome to the Brainstorm Café! Click the button below to get some fresh,
      creative ideas.
    </p>
    <button
      class="bg-primary hover:bg-primary-focus text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 ease-in-out mb-4"
      :disabled="isLoading"
      @click="fetchBrainstorm"
    >
      Get New Ideas
    </button>
    <milestone-reward v-if="shouldShowMilestoneCheck" :id="2" />
    <div
      v-if="isLoading"
      class="loader border-4 border-t-4 border-gray-200 h-12 w-12 rounded-full animate-spin mb-4"
    ></div>

    <transition-group
      name="list"
      tag="div"
      class="flex flex-wrap justify-center gap-4"
    >
      <div
        v-for="idea in allIdeas"
        :key="idea.id"
        class="bg-base-100 shadow-md rounded-lg p-4 w-64"
      >
        <BrainstormCard :idea="idea" @click="handleCardClick(idea)" />
      </div>
    </transition-group>

    <div
      v-if="errorMessage"
      class="bg-warning text-white py-2 px-4 rounded-lg mt-4"
    >
      <Icon name="error" class="text-lg mr-2" /> {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useErrorStore } from './../../../stores/errorStore'
import type { Pitch } from './../../../stores/pitchStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { samplePitches } from './../../../training/samplePitches'

enum PitchType {
  ARTPITCH = 'ARTPITCH',
  BRAINSTORM = 'BRAINSTORM',
  BOT = 'BOT',
  ARTGALLERY = 'ARTGALLERY',
  INSPIRATION = 'INSPIRATION',
}

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const pageImage = '/images/avatars/brain1.webp'
const shouldShowMilestoneCheck = ref(false)

const errorStore = useErrorStore()
const pitchStore = usePitchStore()

// Initialize allIdeas with samplePitches
const allIdeas = ref<Pitch[]>(
  samplePitches.map((pitch, index) => ({
    id: index,
    createdAt: new Date(),
    updatedAt: null,
    title: pitch.title,
    pitch: pitch.pitch,
    designer: 'BRAINSTORM',
    flavorText: null,
    highlightImage: null,
    channelId: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    playerId: null,
  })),
)

const fetchBrainstorm = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    await errorStore.handleError(
      async () => {
        const response = await fetch('/api/botcafe/brainstorm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            n: 5,
            messages: [
              { role: 'user', content: 'another humorous original brainstorm' },
            ],
          }),
        })

        shouldShowMilestoneCheck.value = true

        const data = await response.json()
        if (data.choices && data.choices.length > 0) {
          const newPitches = parsePitchesFromAPI(data.choices)
          if (newPitches.length > 0) {
            pitchStore.addPitches(newPitches)
            allIdeas.value = [...newPitches, ...allIdeas.value]
          } else {
            allIdeas.value = [...samplePitches, ...allIdeas.value]
          }
        } else {
          throw new Error('No ideas generated from the API')
        }
      },
      'GENERAL_ERROR' as ErrorType,
      'Failed to fetch new brainstorming ideas. Please try again.',
    )
  } catch (error) {
    console.error('Error fetching brainstorm:', error)
    errorMessage.value = 'Could not retrieve new ideas. Using cached ideas.'
    allIdeas.value = [...samplePitches, ...allIdeas.value]
  } finally {
    isLoading.value = false
  }
}

const handleCardClick = (pitch: Pitch) => {
  console.log('Card clicked:', pitch)
}

const parsePitchesFromAPI = (
  choices: Array<{ message: { content: string } }>,
) => {
  return choices.map((choice, index: number) => {
    const content = choice.message.content
    const cleanContent = content.replace(/^\d+\.\s/, '')
    const [title, example] = cleanContent.split(' - ')
    return {
      id: index + allIdeas.value.length,
      createdAt: new Date(),
      updatedAt: null,
      title: title || `Idea ${index + 1}`,
      pitch: example || content,
      designer: null,
      flavorText: null,
      highlightImage: null,
      channelId: null,
      PitchType: PitchType.BRAINSTORM,
      isMature: false,
      isPublic: true,
      userId: 1,
      playerId: null,
    } as Pitch
  })
}
</script>

<style scoped>
/* Tailwind utility classes used for styling */
</style>
