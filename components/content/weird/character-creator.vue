<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <!-- Top Section: Name, Alignment, Level, and Save/Generate -->
    <div class="flex items-center justify-between h-[10%] bg-accent rounded-lg shadow-md px-4 py-2">
      <div class="flex flex-col flex-grow">
        <h1 class="text-4xl font-bold text-white truncate">
          <input
            v-model="character.name"
            placeholder="Kind Hero"
            class="bg-transparent border-none text-4xl font-bold text-white w-full focus:outline-none"
          />
          <span v-if="character.honorific" class="text-2xl font-light text-gray-200">
            the <input v-model="character.honorific" class="bg-transparent border-none text-2xl font-light text-gray-200 w-auto focus:outline-none" />
          </span>
        </h1>
        <div class="flex space-x-6 text-sm text-gray-200 mt-1">
          <span>
            Alignment: 
            <input
              v-model="character.alignment"
              placeholder="Neutral"
              class="bg-transparent border-none text-sm text-gray-200 focus:outline-none"
            />
          </span>
          <span>Level: {{ character.level }}</span>
        </div>
      </div>

      <div class="flex space-x-2">
        <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-md text-sm" @click="saveCharacter">
          Save
        </button>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md text-sm" @click="generateCharacter">
          Generate
        </button>
      </div>
    </div>

    <!-- Middle Section: Stats and Image -->
    <div class="flex flex-row justify-between items-start h-[40%] mt-4 space-x-4">
      <div class="w-[70%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4">
        <div class="flex flex-row justify-between w-full">
          <div
            v-for="i in [1, 2, 3]"
            :key="'stat-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <input
              v-model="character[`statName${i}`]"
              class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
            />
            <span class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2">
              <input
                type="number"
                v-model.number="character[`statValue${i}`]"
                class="w-full bg-transparent text-center text-4xl font-bold focus:outline-none"
              />
            </span>
          </div>
        </div>
        <div class="flex flex-row justify-between w-full mt-4">
          <div
            v-for="i in [4, 5, 6]"
            :key="'stat-' + i"
            class="flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
          >
            <input
              v-model="character[`statName${i}`]"
              class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
            />
            <span class="text-4xl font-bold text-gray-800 bg-base-200 rounded-full px-4 py-2 mt-2">
              <input
                type="number"
                v-model.number="character[`statValue${i}`]"
                class="w-full bg-transparent text-center text-4xl font-bold focus:outline-none"
              />
            </span>
          </div>
        </div>
        <button class="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md" @click="rerollStats">
          Reroll Stats
        </button>
      </div>

      <!-- Portrait Section -->
      <div class="w-[30%] flex flex-col items-center bg-gray-800 rounded-lg shadow-md p-4">
        <img
          v-if="character.artImageId"
          :src="`/images/${character.artImageId}.jpg`"
          alt="Character Portrait"
          class="object-cover w-full h-40 rounded-lg mb-4"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="object-cover w-full h-40 rounded-lg mb-4"
        />
        <input
          v-model="character.artPrompt"
          placeholder="Describe your character..."
          class="bg-base-200 text-white w-full p-2 rounded-lg focus:outline-none"
        />
        <div class="flex space-x-2 mt-4">
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg" @click="generateImage">
            Generate
          </button>
          <label class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg cursor-pointer">
            Upload
            <input type="file" class="hidden" @change="uploadImage" />
          </label>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Additional Fields -->
    <div class="flex flex-row justify-between items-start mt-4 h-[50%] space-x-4">
      <!-- Left Column -->
      <div class="w-[48%] flex flex-col space-y-4">
        <textarea v-model="character.species" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Species..."></textarea>
        <textarea v-model="character.quirks" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Quirks..."></textarea>
        <textarea v-model="character.inventory" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Inventory..."></textarea>
      </div>

      <!-- Right Column -->
      <div class="w-[48%] flex flex-col space-y-4">
        <textarea v-model="character.drive" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Drive..."></textarea>
        <textarea v-model="character.skills" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Skills..."></textarea>
        <textarea v-model="character.genre" class="bg-base-200 p-4 rounded-lg shadow-md" placeholder="Genre..."></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';

const characterStore = useCharacterStore();
const character = reactive({
  name: '',
  honorific: 'Adventurer',
  alignment: 'Neutral',
  level: 1,
  artImageId: null,
  artPrompt: '',
  species: '',
  quirks: '',
  skills: '',
  inventory: '',
  drive: '',
  genre: '',
  statName1: 'Luck',
  statValue1: 9,
  statName2: 'Swol',
  statValue2: 9,
  statName3: 'Wits',
  statValue3: 9,
  statName4: 'Fortitude',
  statValue4: 9,
  statName5: 'Rizz',
  statValue5: 9,
  statName6: 'Empathy',
  statValue6: 9,
});

function saveCharacter() {
  characterStore.saveCharacter(character);
}

function generateCharacter() {
  characterStore.generateCharacter(character);
}

function rerollStats() {
  for (let i = 1; i <= 6; i++) {
    character[`statValue${i}`] = Math.floor(Math.random() * 18) + 3; // Simulates rolling 3d6
  }
}

function generateImage() {
  console.log('Generating image with prompt:', character.artPrompt);
  // Implement API call for image generation here
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (file) {
    console.log('Uploading image:', file);
    // Implement upload logic here
  }
}
</script>
