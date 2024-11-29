<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <!-- Top Section: Name and Save/Load/Delete -->
    <div class="flex items-center justify-between h-[10%] bg-accent rounded-lg shadow-md px-4 py-2">
      <!-- Character Name and Class -->
      <div class="flex flex-col">
        <h1 class="text-4xl font-bold text-white">
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
      <div class="flex space-x-4">
        <button
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md text-sm"
          @click="saveCharacter"
        >
          Save
        </button>
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md text-sm"
          @click="loadCharacter"
        >
          Load
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md text-sm"
          @click="deleteCharacter"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Middle Section: Stats and Portrait -->
    <div class="flex flex-row justify-between items-start h-[40%] mt-4 space-x-4">
      <!-- Character Info and Stats -->
      <div class="w-[70%] bg-base-300 border border-gray-400 rounded-lg shadow-md p-4">
        <div class="grid grid-cols-6 gap-4">
          <div
            v-for="i in statKeys.length"
            :key="'stat' + i"
            class="flex flex-col items-center justify-center bg-base-200 p-4 rounded-lg shadow-md"
          >
            <span class="text-sm font-bold uppercase text-gray-600">
              {{ character[`statName${i}`] || `Stat ${i}` }}
            </span>
            <span class="text-3xl font-bold text-accent">
              {{ character[`statValue${i}`] || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Portrait -->
      <div
        class="w-[30%] bg-gray-800 flex items-center justify-center rounded-lg shadow-md"
      >
        <img
          v-if="character.artImageId"
          :src="`/images/${character.artImageId}.jpg`"
          alt="Character Portrait"
          class="object-cover w-full h-full rounded-lg"
        />
        <span v-else class="text-gray-400 text-sm">No Image</span>
      </div>
    </div>

    <!-- Bottom Section: Backstory, Quirks, and Skills -->
    <div class="flex flex-col mt-4 space-y-4">
      <!-- Backstory -->
      <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-bold text-gray-700">Backstory</h2>
        <p class="text-sm text-gray-500 mt-2">
          {{ character.backstory || 'No backstory provided.' }}
        </p>
      </div>

      <!-- Quirks and Skills -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Quirks</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.quirks || 'No quirks specified.' }}
          </p>
        </div>
        <div class="bg-base-300 border border-gray-400 rounded-lg p-4 shadow-md">
          <h2 class="text-lg font-bold text-gray-700">Skills</h2>
          <p class="text-sm text-gray-500 mt-2">
            {{ character.skills || 'No skills specified.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const character = reactive({
  name: '',
  class: '',
  alignment: '',
  level: 1,
  artImageId: null,
  backstory: '',
  quirks: '',
  skills: '',
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

// Save, Load, Delete handlers
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
