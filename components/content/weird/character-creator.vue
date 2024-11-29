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

    <!-- Middle Section: Backstory and Portrait -->
    <div class="flex flex-row justify-between items-start h-[40%] mt-4 space-x-4">
      <!-- Backstory Section -->
      <div class="w-[70%] bg-base-300 border border-gray-400 rounded-lg shadow-md p-4">
        <h2 class="text-lg font-bold text-gray-700 mb-2">Backstory</h2>
        <p class="text-sm text-gray-500 overflow-y-auto h-full">
          {{ character.backstory || 'No backstory provided.' }}
        </p>
      </div>

      <!-- Portrait Section -->
      <div
        class="w-[30%] bg-gray-800 flex items-center justify-center rounded-lg shadow-md"
      >
        <img
          v-if="character.artImageId"
          :src="`/images/${character.artImageId}.jpg`"
          alt="Character Portrait"
          class="object-cover w-full h-full rounded-lg"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="object-cover w-full h-full rounded-lg"
        />
      </div>
    </div>

    <!-- Stats Section -->
    <div class="flex flex-row justify-between items-center mt-4 h-[15%] bg-base-200 rounded-lg shadow-md px-4 py-2">
      <div
        v-for="i in statKeys.length"
        :key="'stat' + i"
        class="flex flex-col items-center justify-center w-[15%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
      >
        <span class="text-sm font-bold uppercase text-gray-700">
          {{ character[`statName${i}`] || `Stat ${i}` }}
        </span>
        <span class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2">
          {{ character[`statValue${i}`] || 0 }}
        </span>
      </div>
    </div>

    <!-- Bottom Section: Quirks, Skills, Inventory, Drive -->
    <div class="flex flex-col mt-4 space-y-4 h-[35%] overflow-y-auto">
      <!-- Quirks Section -->
      <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-bold text-gray-700">Quirks</h2>
        <p class="text-sm text-gray-500 mt-2">
          {{ character.quirks || 'No quirks specified.' }}
        </p>
      </div>

      <!-- Skills Section -->
      <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-bold text-gray-700">Skills</h2>
        <p class="text-sm text-gray-500 mt-2">
          {{ character.skills || 'No skills specified.' }}
        </p>
      </div>

      <!-- Inventory Section -->
      <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-bold text-gray-700">Inventory</h2>
        <p class="text-sm text-gray-500 mt-2">
          {{ character.inventory || 'No inventory specified.' }}
        </p>
      </div>

      <!-- Drive Section -->
      <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-bold text-gray-700">Drive</h2>
        <p class="text-sm text-gray-500 mt-2">
          {{ character.drive || 'No drive specified.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const character = reactive({
  name: '',
  alignment: '',
  class: '',
  level: 1,
  artImageId: null,
  backstory: '',
  quirks: '',
  skills: '',
  inventory: '',
  drive: '',
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

// Dynamically get the stat keys for rendering
const statKeys = [1, 2, 3, 4, 5, 6]

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
