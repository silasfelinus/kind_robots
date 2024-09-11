<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-4 sm:p-6 md:p-8 m-4 md:m-6 border border-primary shadow-xl w-full max-w-full overflow-hidden"
  >
    <!-- Title and Info -->
    <h1
      class="text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary text-center"
    >
      Brainstorm Café
    </h1>
    <p class="text-sm sm:text-lg mb-4 sm:mb-6 text-secondary text-center">
      Select your top five ideas for brainstorming. Click on a pitch to add it
      to your top five, or create your own!
    </p>

    <!-- Custom Pitch Creation Section -->
    <div class="bg-base-100 shadow-md rounded-lg p-4 w-full mb-6">
      <h3 class="text-md md:text-lg font-semibold mb-4 text-primary">
        Create a Custom Pitch
      </h3>
      <input
        v-model="newPitch.title"
        type="text"
        placeholder="Pitch Title"
        class="w-full border border-gray-300 rounded-md p-2 mb-4"
      />
      <textarea
        v-model="newPitch.pitch"
        placeholder="Pitch Description"
        class="w-full border border-gray-300 rounded-md p-2 mb-4"
        rows="3"
      ></textarea>
      <button
        class="bg-primary hover:bg-primary-focus text-white py-2 px-4 rounded-full transition duration-300"
        @click="createCustomPitch"
      >
        Save Custom Pitch
      </button>
    </div>

    <!-- Top 5 Selected Pitches (Responsive) -->
    <div
      class="flex flex-wrap justify-center sm:justify-around mb-6 w-full max-w-full overflow-hidden"
    >
      <div
        v-for="(pitch, index) in selectedPitches"
        :key="index"
        class="bg-accent text-white rounded-lg p-4 m-2 sm:m-0 w-full sm:w-1/3 md:w-1/5 flex flex-col items-center justify-center text-center h-28 sm:h-20 hover:shadow-lg transition duration-300"
      >
        <div v-if="pitch">
          <h4 class="text-md md:text-lg font-semibold">{{ pitch.title }}</h4>
          <p class="text-xs md:text-sm">{{ pitch.pitch }}</p>
        </div>
        <p v-else class="text-gray-400">Select a pitch</p>
      </div>
    </div>

    <!-- Display All Brainstorm Ideas (Responsive Grid with Editing) -->
    <transition-group
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-center w-full max-w-full"
    >
      <div
        v-for="idea in brainstormPitches"
        :key="idea.id"
        class="bg-base-100 shadow-md rounded-lg p-4 cursor-pointer hover:bg-base-300 transition duration-300"
        @click="selectPitch(idea)"
      >
        <!-- Basic Pitch Display -->
        <div>
          <h4 class="text-md md:text-lg font-semibold">{{ idea.title }}</h4>
          <p class="text-xs md:text-sm">{{ idea.pitch }}</p>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.CLAPPED)"
          >
            Clap Reaction
          </button>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.LOVED)"
          >
            Love Reaction
          </button>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.HATED)"
          >
            Hate Reaction
          </button>

          <button
            class="text-blue-500 mt-2 underline hover:text-blue-700"
            @click.stop="toggleExpand(idea.id)"
          >
            {{ expandedPitchId === idea.id ? 'Collapse' : 'Expand' }} Details
          </button>

          <!-- Expanded Pitch Editing Section -->
          <div v-if="expandedPitchId === idea.id" class="mt-4 space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700"
                >Title</label
              >
              <input
                v-model="idea.title"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                for="designer"
                class="block text-sm font-medium text-gray-700"
                >Designer</label
              >

              <input
                v-model="idea.designer"
                type="text"
                class="mt-1 block w-full"
              />
            </div>

            <div>
              <label
                for="flavorText"
                class="block text-sm font-medium text-gray-700"
                >Flavor Text</label
              >
              <textarea
                v-model="idea.flavorText"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="3"
              ></textarea>
            </div>

            <div>
              <label
                for="highlightImage"
                class="block text-sm font-medium text-gray-700"
                >Highlight Image URL</label
              >
              <input
                v-model="idea.highlightImage"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                for="imagePrompt"
                class="block text-sm font-medium text-gray-700"
                >Image Prompt</label
              >
              <textarea
                v-model="idea.imagePrompt"
                placeholder="Enter a few phrases for the AI to generate an image."
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="2"
              ></textarea>
            </div>

            <button
              class="bg-primary hover:bg-primary-focus text-white py-2 px-4 rounded-full transition duration-300"
              @click.stop="saveChanges(idea)"
            >
              Save Changes
            </button>

            <button
              class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
              @click.stop="requestEmbellishment(idea)"
            >
              Embellish with AI
            </button>

            <button
              class="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
              @click.stop="generateImage(idea.imagePrompt || '')"
            >
              Generate Image
            </button>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Button to Submit the Top 5 Selected Pitches -->
    <button
      class="bg-primary hover:bg-primary-focus text-white py-2 sm:py-3 px-6 rounded-full text-base sm:text-lg mt-6 transition-all duration-300"
      :disabled="selectedPitches.filter((p) => p !== null).length < 5"
      @click="submitTopPitches"
    >
      Submit Top 5 Pitches
    </button>

    <!-- Error Message if Any -->
    <div
      v-if="errorStore.message"
      class="bg-warning text-white py-4 px-6 rounded-full mt-6 text-center"
    >
      <icon name="error" class="text-lg" /> {{ errorStore.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePitchStore, PitchType } from '../../../stores/pitchStore' // Ensure you import PitchType
import { useReactionStore, ReactionType } from '../../../stores/reactionStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { useArtStore } from '../../../stores/artStore'
import { useUserStore } from '../../../stores/userStore'
import type { Pitch } from '../../../stores/pitchStore'

// Initialize stores
const pitchStore = usePitchStore()
const errorStore = useErrorStore()
const reactionStore = useReactionStore()
const artStore = useArtStore()
const userStore = useUserStore()

// Selected pitches - explicitly define it as an array of Pitch or null for unselected slots
const selectedPitches = ref<(Pitch | null)[]>([null, null, null, null, null])

// New pitch model for custom input
const newPitch = ref<{ title: string; pitch: string }>({
  title: '',
  pitch: '',
})

// Request AI Embellishment
const requestEmbellishment = async (pitch: Pitch) => {
  try {
    const response = await fetch('/api/botcafe/embellish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: pitch.title, pitch: pitch.pitch }),
    })

    const data = await response.json()

    // Update the pitch with embellishments
    pitch.flavorText = data.flavorText
    pitch.description = data.description
    pitch.imagePrompt = data.imagePrompt

    // Update the store
    pitchStore.updatePitch(pitch.id, {
      flavorText: data.flavorText,
      description: data.description,
      imagePrompt: data.imagePrompt,
    })
  } catch (error) {
    console.error('Failed to request embellishment:', error)
  }
}

// Access brainstorm pitches
const brainstormPitches = computed(() => pitchStore.brainstormPitches)

// Track expanded pitch
const expandedPitchId = ref<number | null>(null)

// Fetch brainstorm ideas on mount
onMounted(() => {
  pitchStore.fetchBrainstormPitches()
})

const generateImage = async (imagePrompt: string) => {
  try {
    const response = await artStore.generateArt({
      promptString: imagePrompt,
      userId: userStore.user?.id,
      steps: 10, // or whatever value for steps
    })
    if (response.success) {
      alert('Image generated successfully!')
    } else {
      alert('Failed to generate image: ' + response.message)
    }
  } catch (error) {
    console.error('Error generating image:', error)
  }
}

const createCustomPitch = () => {
  const pitch = {
    id: Date.now(), // Temporary ID for the pitch
    createdAt: new Date(),
    updatedAt: null,
    title: newPitch.value.title || '', // Provide default value if empty
    pitch: newPitch.value.pitch || '',
    designer: userStore.user?.username || 'Anonymous', // Set the designer as the current user
    flavorText: null,
    description: null,
    highlightImage: null,
    imagePrompt: null,
    channelId: null,
    PitchType: PitchType.BRAINSTORM, // Set the PitchType using the imported enum
    isMature: false, // Default value for isMature
    isPublic: true, // Default value for isPublic
    userId: userStore.user?.id || 1, // Assign a userId, use a default value if not available
    playerId: null, // Default value, adjust as needed
  }

  // Add the new pitch to the selectedPitches array
  selectedPitches.value.unshift(pitch)

  // Clear the input fields for the next pitch creation
  newPitch.value = { title: '', pitch: '' }
}

// Select a pitch for the top 5
const selectPitch = (pitch: Pitch) => {
  const existingIndex = selectedPitches.value.findIndex(
    (p) => p && p.id === pitch.id,
  )

  if (existingIndex === -1) {
    if (selectedPitches.value.filter((p) => p !== null).length < 5) {
      const firstEmptyIndex = selectedPitches.value.indexOf(null)
      selectedPitches.value[firstEmptyIndex] = pitch
    } else {
      selectedPitches.value.splice(4, 1, pitch) // Replace the last one
    }
  }
}

// Toggle pitch details expansion
const toggleExpand = (pitchId: number) => {
  expandedPitchId.value = expandedPitchId.value === pitchId ? null : pitchId
}

// Save edited changes to a pitch
const saveChanges = (pitch: Pitch) => {
  pitchStore.updatePitch(pitch.id, {
    title: pitch.title,
    designer: pitch.designer,
    flavorText: pitch.flavorText,
    highlightImage: pitch.highlightImage,
    imagePrompt: pitch.imagePrompt,
  })
}

// Submit the top 5 selected pitches
const submitTopPitches = async () => {
  try {
    if (selectedPitches.value.filter((p) => p !== null).length !== 5) {
      throw new Error('Please select exactly 5 pitches.')
    }

    const topFive = selectedPitches.value.map((pitch) => ({
      title: pitch?.title || '',
      pitch: pitch?.pitch || '',
    }))

    const response = await fetch('/api/botcafe/submit-pitches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topFive }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit pitches.')
    }

    alert('Top 5 pitches submitted successfully!')
  } catch (error) {
    const err = error as Error
    errorStore.setError(
      ErrorType.NETWORK_ERROR,
      err.message || 'Failed to submit top 5 pitches',
    )
  }
}

const reactToPitch = async (pitch: Pitch, reactionType: ReactionType) => {
  try {
    await reactionStore.createReaction({
      pitchId: pitch.id,
      userId: userStore.userId,
      reactionType, // Use the ReactionType enum directly
    })
  } catch (error) {
    console.error('Failed to react to pitch:', error)
  }
}
</script>

<style scoped>
.card-style {
  background-color: var(--bg-secondary);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
  padding: 1.5rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
}

.card-style:hover {
  transform: translateY(-10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.bg-accent {
  background-color: var(--bg-accent) !important;
}
</style>
