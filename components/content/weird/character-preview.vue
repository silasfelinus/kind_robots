<template>
  <div
    class="w-full mb-6 p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
  >
    <div v-if="character?.value">
      <!-- Header Section -->
      <div class="flex items-start gap-6">
        <img
          :src="computedImage"
          alt="Character avatar"
          class="h-24 w-24 object-cover rounded-lg"
        />
        <div class="flex-grow">
          <h2 class="text-xl font-bold text-gray-800">
            {{ character.value.name }} the
            {{ character.value.honorific || 'Unremarkable' }}
          </h2>
          <p class="text-sm text-gray-500">
            Designer: {{ designerName || 'Unknown' }}
          </p>
          <p class="mt-2 text-sm">
            <span class="font-bold">Genre:</span> {{ character.value.genre }}
          </p>
          <p class="mt-1 text-sm">
            <span class="font-bold">Class:</span> {{ character.value.class }}
          </p>
          <p class="mt-1 text-sm">
            <span class="font-bold">Species:</span>
            {{ character.value.species }}
          </p>
        </div>
        <button
          class="text-sm text-error underline hover:no-underline ml-auto"
          @click="deselectCharacter"
        >
          Deselect
        </button>
      </div>

      <!-- Character Details -->
      <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
        <p v-if="character.value.backstory">
          <span class="font-bold">Backstory:</span>
          {{ character.value.backstory }}
        </p>
        <p v-if="character.value.drive">
          <span class="font-bold">Drive:</span> {{ character.value.drive }}
        </p>
        <p v-if="character.value.inventory">
          <span class="font-bold">Inventory:</span>
          {{ character.value.inventory }}
        </p>
        <p v-if="character.value.quirks">
          <span class="font-bold">Quirks:</span> {{ character.value.quirks }}
        </p>
        <p v-if="character.value.skills">
          <span class="font-bold">Skills:</span> {{ character.value.skills }}
        </p>
        <p v-if="character.value.personality">
          <span class="font-bold">Personality:</span>
          {{ character.value.personality }}
        </p>
      </div>

      <!-- Stats Section -->
      <div class="mt-4">
        <h3 class="text-lg font-bold">Character Stats</h3>
        <div class="grid grid-cols-3 gap-2 mt-2 text-sm">
          <div
            v-for="stat in stats"
            :key="stat.name"
            class="flex justify-between p-2 border rounded-lg bg-base-200"
          >
            <span class="font-bold">{{ stat.name }}:</span>
            <span>{{ stat.value }}</span>
          </div>
        </div>
      </div>

      <!-- Debugging Details Toggle -->
      <button
        class="mt-4 text-sm text-primary underline hover:no-underline"
        @click="toggleDetails"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>

      <!-- Full Object Details -->
      <div
        v-if="showDetails"
        class="mt-2 bg-base-200 border rounded-lg p-4 text-sm"
      >
        <h3 class="font-semibold mb-2">Debugging Info:</h3>
        <pre class="whitespace-pre-wrap text-gray-600">
            {{ JSON.stringify(character.value, null, 2) }}
          </pre
        >
      </div>
    </div>

    <!-- Character Selector -->
    <character-selector v-else />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Props
const { character: propCharacter } = defineProps({
  character: { type: Object, required: false, default: null },
})

// Stores
const characterStore = useCharacterStore()
const artStore = useArtStore()
const userStore = useUserStore()

// Selected Character
const character = computed(
  () => propCharacter || characterStore.selectedCharacter,
)

const artImage = ref<{ fileType: string; imageData: string } | null>(null)

const computedImage = computed(() =>
  artImage.value
    ? `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
    : character?.value?.imagePath || '/images/bot.webp',
)

const designerName = computed(() =>
  character?.value?.userId
    ? userStore.getUserNameByUserId(character.value.userId) || 'Unknown'
    : 'Unknown',
)

const stats = computed(() =>
  Array.from({ length: 6 }, (_, i) => ({
    name: character?.value[`statName${i + 1}`] || `Stat ${i + 1}`,
    value: character?.value[`statValue${i + 1}`] || 0,
  })),
)

// Debugging Details Toggle
const showDetails = ref(false)
const toggleDetails = () => (showDetails.value = !showDetails.value)

// Load Art Image Reactively
const loadArtImage = async () => {
  if (character?.value?.avatarImageId) {
    try {
      const result = await artStore.getArtImageById(
        character.value.avatarImageId,
      )
      if (result) {
        artImage.value = {
          fileType: result.fileType,
          imageData: result.imageData,
        }
      }
    } catch (error) {
      console.error('Failed to load character image:', error)
    }
  } else {
    artImage.value = null
  }
}

// Deselect Character
const deselectCharacter = () => {
  characterStore.selectedCharacter = null
}

// Watch Character for Changes
watch(character, loadArtImage, { immediate: true })
</script>
