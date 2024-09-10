<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-4 m-4 border border-primary shadow-lg"
  >
    <h1 class="text-3xl font-bold mb-4 text-primary">Brainstorm Café</h1>
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

    <div v-for="pitch in allIdeas" :key="pitch.id">
      <PitchDisplay :pitch="pitch" @react="reactToPitch" />
    </div>

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
import { usePitchStore, PitchType } from './../../../stores/pitchStore'
import { useReactionStore } from './../../../stores/reactionStore'
import { samplePitches } from './../../../training/samplePitches'

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const shouldShowMilestoneCheck = ref(false)

const errorStore = useErrorStore()
const pitchStore = usePitchStore()
const reactionStore = useReactionStore()

// Ensure all required fields are set in the initialization
const allIdeas = ref(
  samplePitches.map((pitch, index) => ({
    ...pitch,
    id: index,
    createdAt: new Date(),
    updatedAt: null,
    lovedCount: 0,
    clappedCount: 0,
    booedCount: 0,
    userId: 1,
    playerId: null,
    channelId: null,
    designer: 'Brainstorm', // Set a default designer
    flavorText: null, // Set a default value for flavorText
    highlightImage: null, // Set a default value for highlightImage
    PitchType: PitchType.BRAINSTORM, // Use the PitchType enum
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
      'GENERAL_ERROR',
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

const reactToPitch = async (pitchId: number, reactionType: string) => {
  try {
    await reactionStore.createReaction({
      componentId: pitchId,
      reaction: reactionType,
    })
    const pitch = allIdeas.value.find((p) => p.id === pitchId)
    if (pitch) {
      switch (reactionType) {
        case 'Loved':
          pitch.lovedCount += 1
          break
        case 'Clapped':
          pitch.clappedCount += 1
          break
        case 'Booed':
          pitch.booedCount += 1
          break
      }
    }
  } catch (error) {
    console.error('Error reacting to pitch:', error)
  }
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
      lovedCount: 0,
      clappedCount: 0,
      booedCount: 0,
      channelId: null,
      isMature: false,
      isPublic: true,
      userId: 1,
      playerId: null,
    }
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
</style>
