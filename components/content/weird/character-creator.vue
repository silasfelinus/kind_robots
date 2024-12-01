<template>
  <div
    class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto space-y-4"
  >
    <!-- Top Section: Name, Honorific, Species, Class, Genre, Level, Is Public, and Save/Generate -->
    <div
      class="flex items-center justify-between bg-accent rounded-lg shadow-md px-4 py-2"
    >
      <!-- Character Info -->
      <div class="flex flex-col flex-grow space-y-2">
        <h1 class="text-4xl font-bold truncate">
          <input
            v-model="character.name"
            placeholder="Kind Hero"
            class="bg-transparent border-none text-4xl font-bold w-full focus:outline-none"
          />
        </h1>
        <div class="flex flex-wrap space-x-4">
          <span>
            Honorific:
            <input
              v-model="character.honorific"
              placeholder="Adventurer"
              class="bg-transparent border-none focus:outline-none"
            />
          </span>
          <span>
            Species:
            <input
              v-model="character.species"
              placeholder="Human"
              class="bg-transparent border-none focus:outline-none"
            />
          </span>
          <span>
            Class:
            <input
              v-model="character.class"
              placeholder="Warrior"
              class="bg-transparent border-none focus:outline-none"
            />
          </span>
          <span>
            Genre:
            <input
              v-model="character.genre"
              placeholder="Fantasy"
              class="bg-transparent border-none focus:outline-none"
            />
          </span>
        </div>
      </div>

      <!-- Level, Is Public, and Buttons -->
      <div class="flex flex-col items-end space-y-2">
        <div class="flex items-center space-x-2">
          <label class="flex items-center space-x-2">
            <span>Public</span>
            <input
              v-model="character.isPublic"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
          </label>
          <div class="bg-gray-900 text-center rounded-lg px-4 py-2">
            <strong>Level:</strong> {{ character.level }}
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg shadow-md text-sm"
            :disabled="isSaving"
            @click="saveCharacter"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
          <button
            class="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg shadow-md text-sm"
            @click="generateCharacter"
          >
            Generate
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Section: Stats and Image -->
    <div class="flex flex-row justify-between items-start space-x-4">
      <!-- Stats Section -->
      <div
        class="w-[60%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4 space-y-4"
      >
        <div class="flex flex-row justify-between w-full">
          <div
            v-for="i in [1, 2, 3]"
            :key="'stat-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <input
              v-model="character[`statName${i}` as keyof Character]"
              class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
            />
            <span
              class="text-4xl font-bold text-gray-900 bg-base-200 rounded-full px-4 py-2 mt-2"
            >
              <input
                v-model.number="character[`statValue${i}` as keyof Character]"
                type="number"
                class="w-full bg-transparent text-center text-4xl font-bold focus:outline-none"
              />
            </span>
          </div>
        </div>
        <div class="flex flex-row justify-between w-full">
          <div
            v-for="i in [4, 5, 6]"
            :key="'stat-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <input
              v-model="character[`statName${i}` as keyof Character]"
              class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
            />
            <span
              class="text-4xl font-bold text-gray-900 bg-base-200 rounded-full px-4 py-2 mt-2"
            >
              <input
                v-model.number="character[`statValue${i}` as keyof Character]"
                type="number"
                class="w-full bg-transparent text-center text-4xl font-bold focus:outline-none"
              />
            </span>
          </div>
        </div>
        <button
          class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md"
          @click="rerollStats"
        >
          Reroll Stats
        </button>
      </div>

      <!-- Portrait and ArtPrompt Section -->
      <div
        class="w-[40%] flex flex-col items-center bg-gray-800 rounded-lg shadow-md p-4"
      >
        <!-- Character Image -->
        <img
          v-if="artImage"
          :src="artImage"
          alt="Character Portrait"
          class="object-cover w-full h-60 rounded-lg"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="object-cover w-full h-60 rounded-lg"
        />

        <!-- Art Prompt Textbox -->
        <textarea
          v-model="character.artPrompt"
          placeholder="Describe your character's appearance or a scene for art generation..."
          class="bg-base-200 mt-4 p-4 rounded-lg shadow-md w-full h-32 text-sm resize-none"
        ></textarea>

        <!-- Buttons Section -->
        <div class="flex w-full space-x-2 mt-4">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white w-1/2 px-3 py-1 rounded-lg"
            :disabled="isGeneratingArt"
            @click="generateArtImage"
          >
            {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
          </button>
          <character-uploader class="w-1/2" @uploaded="setArtImageId" />
        </div>
      </div>
    </div>

    <!-- Bottom Section: Backstory and Other Fields -->
    <div class="flex flex-col space-y-4">
      <!-- Backstory -->
      <textarea
        v-model="character.backstory"
        class="bg-base-200 p-4 rounded-lg shadow-md"
        placeholder="Backstory..."
      ></textarea>

      <!-- Other Fields -->
      <div class="flex flex-row justify-between space-x-4">
        <textarea
          v-model="character.quirks"
          class="bg-base-200 p-4 rounded-lg shadow-md flex-1"
          placeholder="Quirks..."
        ></textarea>
        <textarea
          v-model="character.inventory"
          class="bg-base-200 p-4 rounded-lg shadow-md flex-1"
          placeholder="Inventory..."
        ></textarea>
        <textarea
          v-model="character.skills"
          class="bg-base-200 p-4 rounded-lg shadow-md flex-1"
          placeholder="Skills..."
        ></textarea>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useCharacterStore, type Character } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const characterStore = useCharacterStore()
const artStore = useArtStore()
const userStore = useUserStore()

const character = reactive<Partial<Character>>({
  name: '',
  honorific: 'Adventurer',
  species: '',
  class: '',
  genre: '',
  alignment: 'Neutral',
  level: 1,
  isPublic: false,
  artImageId: null,
  artPrompt: '',
  quirks: '',
  skills: '',
  inventory: '',
  backstory: '',
  statName1: 'Luck',
  statValue1: 0,
  statName2: 'Swol',
  statValue2: 0,
  statName3: 'Rizz',
  statValue3: 0,
  statName4: 'Wits',
  statValue4: 0,
  statName5: 'Fortitude',
  statValue5: 0,
  statName6: 'Empathy',
  statValue6: 0,
})

const isSaving = ref(false)
const isGeneratingArt = ref(false)

const artImage = computed(() => {
  if (!character.artImageId) return null
  const image = artStore.getCachedArtImageById(character.artImageId)
  if (!image) return null
  return `data:image/${image.fileType};base64,${image.imageData}`
})

onMounted(() => {
  rerollStats()
})

async function saveCharacter() {
  isSaving.value = true
  try {
    if (character.id) {
      await characterStore.updateCharacter(character.id, character)
    } else {
      await characterStore.createCharacter(character)
    }
    alert('Character saved successfully!')
  } catch (error) {
    console.error('Error saving character:', error)
  } finally {
    isSaving.value = false
  }
}

async function generateCharacter() {
  Object.assign(character, characterStore.newCharacter)
  rerollStats()
}

async function generateArtImage() {
  isGeneratingArt.value = true
  try {
    if (!character.artPrompt) {
      throw new Error('Art prompt is required to generate art.')
    }

    // Construct the GenerateArtData object
    const artData: GenerateArtData = {
      collection: 'characters',
      isPublic: character.isPublic || true,
      designer: userStore.username || 'Kind Designer',
      title: `${character.name} the ${character.honorific}`,
      promptString: character.artPrompt,
      userId: userStore.userId || 10, // Default user ID if not available
      galleryId: 21, // Default gallery ID
      checkpoint: 'stable-diffusion-v1-4', // Default checkpoint
      sampler: 'k_lms', // Default sampler
      steps: 20, // Default steps
      cfg: 2, // Default CFG scale
      cfgHalf: false, // Default CFG Half setting
    }

    // Call generateArt with the constructed data
    const response = await artStore.generateArt(artData)

    // Handle response
    if (response.success && response.data) {
      character.artImageId = response.data.artImageId
      alert('Art generation successful!')
    } else {
      throw new Error(response.message || 'Failed to generate art.')
    }
  } catch (error) {
    console.error('Error generating art image:', error)
  } finally {
    isGeneratingArt.value = false
  }
}

function rerollStats() {
  character.statValue1 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)

  character.statValue2 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)

  character.statValue3 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)

  character.statValue4 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)

  character.statValue5 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)

  character.statValue6 =
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)
}

function setArtImageId(artImageId: number) {
  character.artImageId = artImageId
}
</script>
