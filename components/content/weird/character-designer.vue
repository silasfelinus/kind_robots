<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto space-y-4">
    <!-- Top Section -->
    <div class="flex items-center justify-between bg-accent rounded-lg shadow-md px-4 py-2">
      <!-- Character Info -->
      <div class="flex flex-col flex-grow space-y-2">
        <h1 class="text-4xl font-bold truncate">
          <div class="flex items-center space-x-2">
            <input
              v-model="keepField.name"
              type="checkbox"
              title="Freeze this field"
              class="checkbox checkbox-primary"
            />
            <label>Name:</label>
            <input
              :value="useGenerated.name ? newCharacter.name : character.name"
              placeholder="Kind Hero"
              class="bg-transparent border-none text-4xl font-bold w-full focus:outline-none"
              :disabled="keepField.name"
              @input="(event) => updateField('name', event)"
            />
          </div>
        </h1>
        <div class="flex flex-wrap space-x-4">
          <template v-for="field in ['honorific', 'species', 'class', 'genre']" :key="field">
            <span class="flex items-center space-x-2">
              <input
                v-model="keepField[field]"
                type="checkbox"
                title="Freeze this field"
                class="checkbox checkbox-primary"
              />
              <label>
                {{ field.charAt(0).toUpperCase() + field.slice(1) }}:
              </label>
              <input
                :value="
                  useGenerated[field]
                    ? newCharacter[field as keyof Character]
                    : character[field as keyof Character]
                "
                placeholder="..."
                class="bg-transparent border-none focus:outline-none"
                :disabled="keepField[field as keyof Character]"
                @input="updateField(field as keyof Character, $event)"
              />
            </span>
          </template>
        </div>
      </div>

      <!-- Is Public and Buttons -->
      <div class="flex flex-col items-end space-y-2">
        <div class="flex items-center space-x-2">
          <label class="flex items-center space-x-2">
            <input
              v-model="character.isPublic"
              type="checkbox"
              class="checkbox checkbox-primary"
              checked
            />
            <span>Public</span>
          </label>
        </div>
        <div class="flex space-x-2">
          <button
            class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg shadow-md text-sm"
            :disabled="isSaving"
            @click="saveCharacter"
          >
            {{ isSaving ? 'Saving...' : 'Save All' }}
          </button>
          <button
            class="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg shadow-md text-sm"
            @click="generateFields"
          >
            Generate
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Section -->
    <div class="flex flex-row justify-between items-start space-x-4">
      <!-- Stats Section -->
      <div
        class="w-[60%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4 space-y-4"
      >
        <div class="flex flex-wrap justify-between w-full">
          <template v-for="i in 6" :key="'stat-' + i">
            <div
              class="relative flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
            >
              <input
                v-model="keepField[`statName${i}`]"
                type="checkbox"
                title="Freeze Stat"
                class="absolute top-1 right-1 checkbox checkbox-primary"
              />
              <input
                :value="
                  useGenerated[`statName${i}`]
                    ? newCharacter[`statName${i}` as keyof Character]
                    : character[`statName${i}` as keyof Character]
                "
                class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
                :disabled="keepField[`statName${i}`]"
                @input="
                  (event) =>
                    updateField(`statName${i}` as keyof Character, event)
                "
              />
              <input
                :value="
                  useGenerated[`statValue${i}`]
                    ? newCharacter[`statValue${i}` as keyof Character]
                    : character[`statValue${i}` as keyof Character]
                "
                class="bg-transparent border-none text-4xl font-bold text-center focus:outline-none"
                :disabled="keepField[`statValue${i}`]"
                @input="
                  (event) =>
                    updateField(`statValue${i}` as keyof Character, event)
                "
              />
            </div>
          </template>
        </div>
        <button
          class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md"
          @click="rerollStats"
        >
          Reroll Stats
        </button>
      </div>

      <!-- ArtPrompt Section -->
      <div
        class="w-[40%] flex flex-col items-center bg-gray-800 rounded-lg shadow-md p-4"
      >
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
       <textarea
  v-model="computedArtPrompt"
  placeholder="Describe your character's appearance or a scene for art generation..."
  class="bg-base-200 mt-4 p-4 rounded-lg shadow-md w-full h-32 text-sm resize-none"
></textarea>
<div class="flex w-full space-x-2 mt-4">
  <button
    class="relative bg-blue-500 hover:bg-blue-600 text-white w-1/2 py-1 rounded-lg flex justify-center items-center"
    :disabled="isGeneratingArt"
    @click="generateArtImage"
  >
    <span v-if="!isGeneratingArt">Generate Art</span>
    <span v-else>
      <svg
        class="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
  </button>
  <character-uploader class="w-1/2" @uploaded="setArtImageId" />
</div>

      </div>
    </div>

    <!-- Bottom Section -->
    <div class="flex flex-col space-y-4">
      <div class="flex items-center space-x-2">
        <label class="block text-gray-700 font-bold">Backstory</label>
        <input
          v-model="keepField.backstory"
          type="checkbox"
          title="Freeze Backstory"
          class="checkbox checkbox-primary"
        />
      </div>
      <textarea
        :value="useGenerated.backstory ? newCharacter.backstory : character.backstory"
        placeholder="..."
        class="bg-base-200 p-4 rounded-lg shadow-md w-full"
        :disabled="keepField.backstory"
        @input="(event) => updateField('backstory', event)"
      ></textarea>
    </div>
    <div class="flex flex-row space-x-4">
      <template v-for="field in ['quirks', 'inventory', 'skills']" :key="field">
        <div class="relative w-[33%]">
          <label class="block text-gray-700 font-bold mb-2">
            {{ field.charAt(0).toUpperCase() + field.slice(1) }}
          </label>
          <textarea
            :value="useGenerated[field] ? newCharacter[field] : character[field]"
            placeholder="..."
            class="bg-base-200 p-4 rounded-lg shadow-md w-full"
            :disabled="keepField[field]"
            @input="(event) => updateField(field, event)"
          ></textarea>
          <input
            v-model="keepField[field]"
            type="checkbox"
            title="Freeze Field"
            class="absolute top-0 right-0 mt-2 mr-2 checkbox checkbox-primary"
          />
        </div>
      </template>
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

const computedArtPrompt = computed({
  get() {
    return useGenerated.artPrompt ? newCharacter.artPrompt : character.artPrompt
  },
  set(value: string) {
    if (useGenerated.artPrompt) {
      newCharacter.artPrompt = value
    } else {
      character.artPrompt = value
    }
  },
})

// State for the original character and generated data
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

const newCharacter = reactive<Partial<Character>>({})
const useGenerated = reactive<Record<string, boolean>>({
  name: false,
  honorific: false,
  species: false,
  class: false,
  genre: false,
  artPrompt: false,
  statName1: false,
  statValue1: false,
  statName2: false,
  statValue2: false,
  statName3: false,
  statValue3: false,
  statName4: false,
  statValue4: false,
  statName5: false,
  statValue5: false,
  statName6: false,
  statValue6: false,
})
const keepField = reactive<Record<string, boolean>>({
  name: false,
  honorific: false,
  species: false,
  class: false,
  genre: false,
  artPrompt: false,
  statName1: false,
  statValue1: false,
  statName2: false,
  statValue2: false,
  statName3: false,
  statValue3: false,
  statName4: false,
  statValue4: false,
  statName5: false,
  statValue5: false,
  statName6: false,
  statValue6: false,
})

const isSaving = ref(false)
const isGeneratingArt = ref(false)

// Computed property for the art image
const artImage = computed(() => {
  if (!character.artImageId) return null
  const image = artStore.getCachedArtImageById(character.artImageId)
  if (!image) return null
  return `data:image/${image.fileType};base64,${image.imageData}`
})

onMounted(() => {
  rerollStats()
})

function updateField(field: keyof Character, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    const value = target.value
    // Ensure the field being updated is a string
    if (
      typeof character[field] === 'string' ||
      typeof newCharacter[field] === 'string'
    ) {
      if (useGenerated[field]) {
        ;(newCharacter as Record<string, string>)[field] = value
      } else {
        ;(character as Record<string, string>)[field] = value
      }
    } else {
      console.warn(`Field ${field} is not a string and cannot be updated.`)
    }
  }
}

// Save the character (original or with applied generated fields)
async function saveCharacter() {
  isSaving.value = true
  try {
    const characterToSave: Partial<Character> = { ...character }

    // Apply generated fields where applicable
    Object.keys(newCharacter).forEach((key) => {
      if (useGenerated[key as keyof Character]) {
        ;(characterToSave as Record<string, unknown>)[key] =
          newCharacter[key as keyof Character]
      }
    })

    // Save character
    if (character.id) {
      await characterStore.updateCharacter(character.id, characterToSave)
    } else {
      await characterStore.createCharacter(characterToSave)
    }

    alert('Character saved successfully!')
  } catch (error) {
    console.error('Error saving character:', error)
  } finally {
    isSaving.value = false
  }
}

async function generateFields() {
  // Filter string fields that are not marked as "keep"
  const fieldsToUpgrade = Object.keys(character).filter(
    (key) =>
      !keepField[key] &&
      typeof character[key as keyof Character] === 'string' &&
      !key.startsWith('statValue'), // Explicitly exclude statValue fields
  )

  try {
    // Call generateCharacterUpdate with filtered fields
    await characterStore.generateCharacterUpdate(character, fieldsToUpgrade)
    if (characterStore.generatedCharacter) {
      Object.assign(newCharacter, characterStore.generatedCharacter)
    }
  } catch (error) {
    console.error('Error generating fields:', error)
  }
}

// Generate art for the character
async function generateArtImage() {
  isGeneratingArt.value = true
  try {
    if (!character.artPrompt) {
      throw new Error('Art prompt is required to generate art.')
    }
    const artData: GenerateArtData = {
      collection: 'characters',
      isPublic: character.isPublic || true,
      designer: userStore.username || 'Kind Designer',
      title: `${character.name} the ${character.honorific}`,
      promptString: character.artPrompt,
      userId: userStore.userId || 10, // Default user ID
      galleryId: 21, // Default gallery ID
      checkpoint: 'stable-diffusion-v1-4',
      sampler: 'k_lms',
      steps: 20,
      cfg: 2,
      cfgHalf: false,
    }
    const response = await artStore.generateArt(artData)
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

// Toggle between original and generated values
function toggleField(field: string) {
  useGenerated[field] = !useGenerated[field]
}

// Reroll stats for the character
function rerollStats() {
  character.statValue1 = rollDice()
  character.statValue2 = rollDice()
  character.statValue3 = rollDice()
  character.statValue4 = rollDice()
  character.statValue5 = rollDice()
  character.statValue6 = rollDice()
}

// Helper function to roll dice
function rollDice() {
  return (
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)
  )
}

// Set the art image ID after upload
function setArtImageId(artImageId: number) {
  character.artImageId = artImageId
}
</script>
