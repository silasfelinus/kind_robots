<template>
  <div class="flex h-screen w-full">
    <!-- Character Sheet -->
    <div class="w-4/5 p-6 bg-gray-100 overflow-auto">
      <h1 class="text-3xl font-bold mb-4">Character Sheet</h1>

      <!-- Name -->
      <div class="mb-4">
        <label class="font-bold">Name:</label>
        <div class="flex items-center">
          <input
            v-model="character.name"
            type="text"
            placeholder="Enter character name"
            class="border p-2 w-full"
          />
          <ActionToggle field="name" />
        </div>
      </div>

      <!-- Class and Alignment -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="font-bold">Class:</label>
          <div class="flex items-center">
            <input
              v-model="character.class"
              type="text"
              placeholder="Enter class"
              class="border p-2 w-full"
            />
            <ActionToggle field="class" />
          </div>
        </div>
        <div>
          <label class="font-bold">Alignment:</label>
          <div class="flex items-center">
            <input
              v-model="character.alignment"
              type="text"
              placeholder="Enter alignment"
              class="border p-2 w-full"
            />
            <ActionToggle field="alignment" />
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-4">
        <label class="font-bold">Stats:</label>
        <div v-for="i in 6" :key="'stat' + i" class="flex items-center mb-2">
          <input
            v-model="character[`statName${i}`]"
            type="text"
            :placeholder="'Stat ' + i + ' Name'"
            class="border p-2 w-1/2 mr-2"
          />
          <input
            v-model.number="character[`statValue${i}`]"
            type="number"
            :placeholder="'Stat ' + i + ' Value'"
            class="border p-2 w-1/4 mr-2"
            min="1"
            max="18"
          />
          <ActionToggle :field="'stat' + i" />
        </div>
      </div>

      <!-- Backstory -->
      <div class="mb-4">
        <label class="font-bold">Backstory:</label>
        <div class="flex items-center">
          <textarea
            v-model="character.backstory"
            placeholder="Enter backstory"
            class="border p-2 w-full"
          ></textarea>
          <ActionToggle field="backstory" />
        </div>
      </div>

      <!-- Quirks and Skills -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="font-bold">Quirks:</label>
          <div class="flex items-center">
            <textarea
              v-model="character.quirks"
              placeholder="Enter quirks separated by |!"
              class="border p-2 w-full"
            ></textarea>
            <ActionToggle field="quirks" />
          </div>
        </div>
        <div>
          <label class="font-bold">Skills:</label>
          <div class="flex items-center">
            <textarea
              v-model="character.skills"
              placeholder="Enter skills separated by |!"
              class="border p-2 w-full"
            ></textarea>
            <ActionToggle field="skills" />
          </div>
        </div>
      </div>

      <!-- Genre -->
      <div class="mb-4">
        <label class="font-bold">Genre:</label>
        <div class="flex items-center">
          <input
            v-model="character.genre"
            type="text"
            placeholder="Enter genre"
            class="border p-2 w-full"
          />
          <ActionToggle field="genre" />
        </div>
      </div>
    </div>

    <!-- Ubermaintenance Section -->
    <div class="w-1/5 bg-gray-200 p-6 flex flex-col">
      <h2 class="text-xl font-bold mb-4">Ubermaintenance</h2>
      <button class="mb-2 bg-green-500 text-white py-2 px-4 rounded">
        Save
      </button>
      <button class="mb-2 bg-blue-500 text-white py-2 px-4 rounded">
        Load
      </button>
      <button class="mb-2 bg-red-500 text-white py-2 px-4 rounded">
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'


const character = reactive({
  name: '',
  class: '',
  alignment: '',
  backstory: '',
  quirks: '',
  skills: '',
  genre: '',
  statName1: 'Luck',
  statValue1: 9,
  statName2: 'Swol',
  statValue2: 9,
  statName3: 'Wits',
  statValue3: 9,
  statName4: 'Durability',
  statValue4: 9,
  statName5: 'Rizz',
  statValue5: 9,
  statName6: 'Skibidi',
  statValue6: 9,
})
</script>

<style>
body {
  font-family: Arial, sans-serif;
}
</style>
