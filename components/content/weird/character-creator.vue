<template>
  <div class="flex h-full w-full">
    <!-- Character Sheet -->
    <div class="bg-gray-100 overflow-auto">
      <h1 class="text-3xl font-bold mb-4">Character Sheet</h1>

      <!-- Character Image -->
      <div class="mb-6">
        <div class="flex items-center">
          <div
            class="w-24 h-24 rounded bg-gray-300 flex items-center justify-center"
          >
            <img
              v-if="character.artImageId"
              :src="`/images/${character.artImageId}.jpg`"
              alt="Character Image"
              class="object-cover w-full h-full rounded"
            />
            <span v-else class="text-xs text-gray-500">No Image</span>
          </div>
          <div class="ml-4">
            <label class="font-bold block">Art Prompt:</label>
            <textarea
              v-model="character.artPrompt"
              placeholder="Enter art description"
              class="border p-2 w-96"
            ></textarea>
            <button
              class="mt-2 bg-blue-500 text-white py-1 px-3 rounded text-sm"
            >
              Generate Image
            </button>
          </div>
        </div>
      </div>

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
          <PreserveToggle :value="character.name" />
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
            <PreserveToggle :value="character.class" />
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
            <PreserveToggle :value="character.alignment" />
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
            disabled
          />
          <input
            v-model.number="character[`statValue${i}`]"
            type="number"
            :placeholder="'Stat ' + i + ' Value'"
            class="border p-2 w-1/4 mr-2"
            min="1"
            max="18"
          />
          <PreserveToggle :value="character[`statValue${i}`]" />
        </div>
      </div>
    </div>

    <!-- Ubermaintenance Section -->
    <div class="w-1/5 bg-gray-200 p-4 flex flex-col">
      <h2 class="text-lg font-bold mb-4">Ubermaintenance</h2>
      <button class="mb-2 bg-green-500 text-white py-1 px-2 rounded text-sm">
        Save
      </button>
      <button class="mb-2 bg-blue-500 text-white py-1 px-2 rounded text-sm">
        Load
      </button>
      <button class="mb-2 bg-red-500 text-white py-1 px-2 rounded text-sm">
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
  artPrompt: '',
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
