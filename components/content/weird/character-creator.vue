<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <!-- Top Section: Name, Alignment, Level, and Save/Load/Delete -->
    <div
      class="flex items-center justify-between h-[10%] bg-accent rounded-lg shadow-md px-4 py-2"
    >
      <!-- Character Name and Class -->
      <div class="flex flex-col flex-grow">
        <h1 class="text-4xl font-bold text-white truncate">
          {{ character.name || 'Unnamed Hero' }}
          <span
            v-if="character.class"
            class="text-2xl font-light text-gray-200"
          >
            the {{ character.class }}
          </span>
        </h1>
        <div class="flex space-x-6 text-sm text-gray-200 mt-1">
          <span>Alignment: {{ character.alignment || 'Neutral' }}</span>
          <span>Level: {{ character.level || 1 }}</span>
          <span>Experience: {{ character.experience || 0 }}</span>
        </div>
      </div>

      <!-- Save, Load, Delete Buttons -->
      <div class="flex space-x-2">
        <button
          class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-md text-sm"
          @click="saveCharacter"
        >
          Save
        </button>
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md text-sm"
          @click="loadCharacter"
        >
          Load
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow-md text-sm"
          @click="deleteCharacter"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Middle Section: Stats and Portrait -->
    <div
      class="flex flex-row justify-between items-start h-[40%] mt-4 space-x-4"
    >
      <!-- Stats Section -->
      <div
        class="w-[70%] flex flex-col bg-base-300 border border-gray-400 rounded-lg shadow-md p-4"
      >
        <div class="flex flex-row justify-between">
          <div
            v-for="i in statKeys.length"
            :key="'stat' + i"
            class="flex flex-col items-center justify-center w-[15%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <span class="text-sm font-bold uppercase text-center text-gray-700">
              {{ character[`statName${i}`] || `Stat ${i}` }}
            </span>
            <span
              class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2"
            >
              {{ character[`statValue${i}`] || 0 }}
            </span>
          </div>
        </div>
        <button
          class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-lg shadow-md self-center"
          @click="rerollStats"
        >
          Re-roll Stats
        </button>
      </div>

      <!-- Portrait Section -->
      <div
        class="w-[30%] bg-gray-800 flex flex-col items-center justify-start rounded-lg shadow-md p-4"
      >
        <img
          v-if="artImage"
          :src="artImage.imageData"
          alt="Character Portrait"
          class="object-cover w-full h-2/3 rounded-lg mb-4"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="object-cover w-full h-2/3 rounded-lg mb-4"
        />
        <button
          class="bg-blue-500 text-white py-1 px-4 rounded-md text-sm mb-2"
        >
          Upload Image
        </button>
        <textarea
          v-model="character.artPrompt"
          placeholder="Enter image prompt"
          class="border p-2 w-full rounded-md text-sm"
        ></textarea>
        <button
          class="bg-green-500 text-white py-1 px-4 rounded-md text-sm mt-2"
          @click="generateCharacterImage"
        >
          Generate from Prompt
        </button>
      </div>
    </div>

    <!-- Bottom Section: Details -->
    <div class="flex flex-row justify-between h-[50%] mt-4 space-x-4">
      <!-- Left Column: Quirks, Skills -->
      <div class="w-1/2 flex flex-col space-y-4">
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Quirks</h2>
          <ul class="list-disc ml-4 text-sm text-gray-500">
            <li v-for="quirk in quirksArray" :key="quirk">{{ quirk }}</li>
            <li v-if="quirksArray.length === 0">No quirks specified.</li>
          </ul>
        </div>
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Skills</h2>
          <ul class="list-disc ml-4 text-sm text-gray-500">
            <li v-for="skill in skillsArray" :key="skill">{{ skill }}</li>
            <li v-if="skillsArray.length === 0">No skills specified.</li>
          </ul>
        </div>
      </div>

      <!-- Right Column: Inventory, Drive, Species, Genre -->
      <div class="w-1/2 flex flex-col space-y-4">
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Inventory</h2>
          <ul class="list-disc ml-4 text-sm text-gray-500">
            <li v-for="item in inventoryArray" :key="item">{{ item }}</li>
            <li v-if="inventoryArray.length === 0">No inventory specified.</li>
          </ul>
        </div>
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Drive</h2>
          <p class="text-sm text-gray-500">
            {{ character.drive || 'No drive specified.' }}
          </p>
        </div>
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Species</h2>
          <p class="text-sm text-gray-500">
            {{ character.species || 'No species specified.' }}
          </p>
        </div>
        <div
          class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md"
        >
          <h2 class="text-lg font-bold text-gray-700">Genre</h2>
          <p class="text-sm text-gray-500">
            {{ character.genre || 'No genre specified.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'

// Initialize Stores
const characterStore = useCharacterStore()
const artStore = useArtStore()

// Current Character and Art Image
const character = computed(() => characterStore.newCharacter)
const artImage = computed(() =>
  character.value.artImageId
    ? artStore.getArtImageById(character.value.artImageId)
    : null,
)

// Stat Keys Using Default Names
const statKeys = [
  'statName1',
  'statName2',
  'statName3',
  'statName4',
  'statName5',
  'statName6',
]

// Arrays for Display
const quirksArray = computed(() =>
  character.value.quirks ? character.value.quirks.split('|!') : [],
)
const skillsArray = computed(() =>
  character.value.skills ? character.value.skills.split('|!') : [],
)
const inventoryArray = computed(() =>
  character.value.inventory ? character.value.inventory.split('|!') : [],
)

// Functions
function rerollStats() {
  characterStore.rerollStats()
}

function saveCharacter() {
  characterStore.saveNewCharacter()
}

function loadCharacter() {
  characterStore.loadCharacterById(character.value.id)
}

function deleteCharacter() {
  characterStore.deleteCharacter(character.value.id)
}

async function generateCharacterImage() {
  if (!character.value.artPrompt) return
  await characterStore.generateCharacterImage(character.value.artPrompt)
}
</script>
