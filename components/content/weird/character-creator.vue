<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <!-- Top Section: Name, Alignment, Level, and Save/Load/Delete -->
    <div class="flex items-center justify-between h-[10%] bg-accent rounded-lg shadow-md px-4 py-2">
      <!-- Character Name and Class -->
      <div class="flex flex-col flex-grow">
        <h1 class="text-4xl font-bold text-white truncate">
          {{ character.name || 'Unnamed Hero' }}
          <span v-if="character.class" class="text-2xl font-light text-gray-200">
            the {{ character.class }}
          </span>
        </h1>
        <div class="flex space-x-6 text-sm text-gray-200 mt-1">
          <span>Alignment: {{ character.alignment || 'Neutral' }}</span>
          <span>Level: {{ character.level || 1 }}</span>
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

    <!-- Middle Section: Stats and Image -->
    <div class="flex flex-row justify-between items-start h-[40%] mt-4 space-x-4">
      <!-- Stats Section -->
      <div class="w-[70%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4">
        <div class="flex flex-row justify-between w-full">
          <div
            v-for="i in 3"
            :key="'stat-row1-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <span class="text-sm font-bold uppercase text-gray-700">
              {{ character[`statName${i}`] || `Stat ${i}` }}
            </span>
            <span class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2">
              {{ character[`statValue${i}`] || 0 }}
            </span>
          </div>
        </div>
        <div class="flex flex-row justify-between w-full mt-4">
          <div
            v-for="i in [4, 5, 6]"
            :key="'stat-row2-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <span class="text-sm font-bold uppercase text-gray-700">
              {{ character[`statName${i}`] || `Stat ${i}` }}
            </span>
            <span class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2">
              {{ character[`statValue${i}`] || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Image Section -->
      <div class="w-[30%]">
        <ImageSection :imageId="character.artImageId" />
      </div>
    </div>

    <!-- Bottom Section: Balanced Layout -->
    <div class="flex flex-row justify-between items-start mt-4 h-[50%] space-x-4">
      <!-- Left Column -->
      <div class="w-[48%] flex flex-col space-y-4">
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Species</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.species || 'No species specified.' }}
          </p>
        </div>
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Quirks</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.quirks || 'No quirks specified.' }}
          </p>
        </div>
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Inventory</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.inventory || 'No inventory specified.' }}
          </p>
        </div>
      </div>

      <!-- Right Column -->
      <div class="w-[48%] flex flex-col space-y-4">
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Genre</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.genre || 'No genre specified.' }}
          </p>
        </div>
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Skills</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.skills || 'No skills specified.' }}
          </p>
        </div>
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Drive</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.drive || 'No drive specified.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import ImageSection from './ImageSection.vue'

const character = reactive({
  name: '',
  alignment: '',
  class: '',
  level: 1,
  artImageId: null,
  species: '',
  backstory: '',
  quirks: '',
  skills: '',
  inventory: '',
  drive: '',
  genre: '',
  statName1: 'Strength',
  statValue1: 10,
  statName2: 'Dexterity',
  statValue2: 10,
  statName3: 'Constitution',
  statValue3: 10,
  statName4: 'Intelligence',
  statValue4: 10,
  statName5: 'Wisdom',
  statValue5: 10,
  statName6: 'Charisma',
  statValue6: 10,
})

// Handlers for Save, Load, and Delete
function saveCharacter() {
  console.log('Saving character:', character)
}

function loadCharacter() {
  console.log('Loading character...')
}

function deleteCharacter() {
  console.log('Deleting character...')
}
</script>
