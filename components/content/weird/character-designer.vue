<template>
  <div
    class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto space-y-4"
  >
    <!-- Top Section -->
    <div
      class="flex items-center justify-between bg-accent rounded-lg shadow-md px-4 py-2"
    >
      <!-- Character Info -->
      <div class="flex flex-col flex-grow space-y-2">
        <h1 class="text-4xl font-bold truncate">
          <div class="flex items-center space-x-2">
            <CheckboxToggle
              v-if="characterStore.generationMode"
              v-model="keepField.name"
              label="Name"
              title="Freeze Name"
            />
            <label>Name:</label>
            <input
              :value="useGenerated.name ? newCharacter.name : character.name"
              placeholder="Kind Hero"
              class="bg-transparent border-none text-4xl font-bold w-full focus:outline-none"
              :disabled="keepField.name"
              @input="(event) => updateField('name', event)"
            />
            <button
              v-if="newCharacter.name"
              class="text-sm bg-gray-700 px-2 py-1 rounded"
              @click="toggleField('name')"
            >
              {{ useGenerated.name ? 'Generated' : 'Original' }}
            </button>
          </div>
        </h1>
        <div class="flex flex-wrap space-x-4">
          <template
            v-for="field in ['honorific', 'species', 'class', 'genre']"
            :key="field"
          >
            <span class="flex items-center space-x-2">
              <CheckboxToggle
                v-if="characterStore.generationMode"
                v-model="keepField[field]"
                :label="field.charAt(0).toUpperCase() + field.slice(1)"
                :title="'Freeze ' + field"
              />
              <label
                >{{ field.charAt(0).toUpperCase() + field.slice(1) }}:</label
              >
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
              <button
                v-if="newCharacter[field as keyof Character]"
                class="text-sm bg-gray-700 px-2 py-1 rounded"
                @click="toggleField(field as keyof Character)"
              >
                {{ useGenerated[field] ? 'Generated' : 'Original' }}
              </button>
            </span>
          </template>
        </div>
      </div>

      <!-- Is Public and Buttons -->
      <div class="flex flex-col items-end space-y-2">
        <label class="flex items-center space-x-2">
          <CheckboxToggle
            v-model="character.isPublic"
            label="Public"
            title="Toggle public visibility"
          />
        </label>
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
        class="w-[50%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4 space-y-4"
      >
        <div class="flex flex-wrap justify-between w-full">
          <template v-for="i in 6" :key="'stat-' + i">
            <div
              class="relative flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
            >
              <span
                class="text-sm font-bold uppercase text-gray-700 text-center"
              >
                {{ character[`statName${i}` as keyof Character] }}
              </span>
              <span class="text-4xl font-bold text-center">
                {{ character[`statValue${i}` as keyof Character] }}
              </span>
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

      <!-- Rewards Section -->
      <character-rewards class="w-[50%]" />

      <!-- ArtPrompt Section -->
      <div
        class="w-[50%] flex flex-col items-center bg-gray-800 rounded-lg shadow-md p-4"
      >
        <div class="aspect-[3/4] w-full h-auto">
          <img
            v-if="artImage"
            :src="artImage"
            alt="Character Portrait"
            class="object-cover w-full rounded-lg"
          />
          <img
            v-else
            src="/images/bot.webp"
            alt="Default Portrait"
            class="object-cover w-full rounded-lg"
          />
        </div>
        <textarea
          v-model="computedArtPrompt"
          placeholder="Describe your character's appearance or a scene for art generation..."
          class="bg-base-200 mt-4 p-4 rounded-lg shadow-md w-full h-32 text-sm resize-none"
        ></textarea>
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

    <!-- Bottom Section -->
    <div class="flex flex-col space-y-4">
      <template
        v-for="field in ['backstory', 'quirks', 'inventory', 'skills']"
        :key="field"
      >
        <div class="relative w-full">
          <CheckboxToggle
            v-if="characterStore.generationMode"
            v-model="keepField[field]"
            :label="`Freeze ${field}`"
          />
          <textarea
            :value="getFieldValue(field as keyof Character)"
            placeholder="..."
            class="bg-base-200 p-4 rounded-lg shadow-md w-full"
            :disabled="keepField[field as keyof Character]"
            @input="(event) => updateField(field as keyof Character, event)"
          ></textarea>
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

function getFieldValue(field: keyof Character) {
  const value = useGenerated[field] ? newCharacter[field] : character[field]
  return typeof value === 'string' ? value : ''
}

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
  isPublic: true,
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
      await characterStore.patchCharacter(character.id, characterToSave)
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

function toggleField(field: keyof Character) {
  if (!newCharacter[field] || !character[field]) {
    console.warn(`Field "${field}" does not exist in one of the data sources.`)
    return
  }
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
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1) +
    Math.floor(Math.random() * 10 + 1)
  )
}

// Set the art image ID after upload
function setArtImageId(artImageId: number) {
  character.artImageId = artImageId
}
</script>
