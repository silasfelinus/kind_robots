<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto space-y-4">
    <!-- Top Section: Name, Honorific, Species, Class, Genre, Level, Is Public, and Save/Generate -->
    <div class="flex items-center justify-between bg-accent rounded-lg shadow-md px-4 py-2">
      <!-- Character Info -->
      <div class="flex flex-col flex-grow space-y-2">
        <h1 class="text-4xl font-bold text-white truncate">
          <input
            v-model="character.name"
            placeholder="Kind Hero"
            class="bg-transparent border-none text-4xl font-bold text-white w-full focus:outline-none"
          />
        </h1>
        <div class="flex flex-wrap space-x-4 text-base text-white">
          <span>
            Honorific: 
            <input
              v-model="character.honorific"
              placeholder="Adventurer"
              class="bg-transparent border-none text-base text-white focus:outline-none"
            />
          </span>
          <span>
            Species: 
            <input
              v-model="character.species"
              placeholder="Human"
              class="bg-transparent border-none text-base text-white focus:outline-none"
            />
          </span>
          <span>
            Class: 
            <input
              v-model="character.class"
              placeholder="Warrior"
              class="bg-transparent border-none text-base text-white focus:outline-none"
            />
          </span>
          <span>
            Genre: 
            <input
              v-model="character.genre"
              placeholder="Fantasy"
              class="bg-transparent border-none text-base text-white focus:outline-none"
            />
          </span>
        </div>
      </div>

      <!-- Level, Is Public, and Buttons -->
      <div class="flex flex-col items-end space-y-2">
        <div class="flex items-center space-x-2">
          <label class="flex items-center text-white space-x-2">
            <span>Public</span>
            <input type="checkbox" v-model="character.isPublic" class="checkbox checkbox-primary" />
          </label>
          <div class="bg-gray-900 text-white text-center rounded-lg px-4 py-2">
            <strong>Level:</strong> {{ character.level }}
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-md text-sm"
            :disabled="isSaving"
            @click="saveCharacter"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md text-sm"
            @click="generateCharacter"
          >
            Generate
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Section: Stats and Image -->
    <div class="flex flex-row justify-between items-start space-x-4">
      <!-- Stats Section -->
      <div class="w-[60%] flex flex-col items-center bg-base-200 rounded-lg shadow-md p-4 space-y-4">
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
        <div class="flex flex-row justify-between w-full">
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
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md" @click="rerollStats">
          Reroll Stats
        </button>
      </div>

      <!-- Portrait and ArtPrompt Section -->
      <div class="w-[40%] flex flex-col items-center bg-gray-800 rounded-lg shadow-md p-4">
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

    <!-- Bottom Section: Backstory and Other Fields -->
    <div class="flex flex-col space-y-4">
      <!-- Backstory -->
      <textarea
        v-model="character.backstory"
        class="bg-base-200 p-4 rounded-lg shadow-md"
        placeholder="Backstory..."
      ></textarea>

      <!-- Other Fields -->
      <div class="flex flex-row justify-between space-x-4">
        <textarea v-model="character.quirks" class="bg-base-200 p-4 rounded-lg shadow-md flex-1" placeholder="Quirks..."></textarea>
        <textarea v-model="character.inventory" class="bg-base-200 p-4 rounded-lg shadow-md flex-1" placeholder="Inventory..."></textarea>
        <textarea v-model="character.skills" class="bg-base-200 p-4 rounded-lg shadow-md flex-1" placeholder="Skills..."></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useArtStore } from '@/stores/artStore';

const characterStore = useCharacterStore();
const artStore = useArtStore();

const character = reactive({
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
  statName3: 'Wits',
  statValue3: 0,
  statName4: 'Fortitude',
  statValue4: 0,
  statName5: 'Rizz',
  statValue5: 0,
  statName6: 'Empathy',
  statValue6: 0,
});

const isSaving = ref(false);
const isGeneratingArt = ref(false);

const artImage = computed(() => {
  if (!character.artImageId) return null;
  return artStore.getArtImageById(character.artImageId);
});

onMounted(() => {
  rerollStats(); // Generate random stats on load
});

async function saveCharacter() {
  isSaving.value = true;
  try {
    await characterStore.saveCharacter(character);
    alert('Character saved successfully!');
  } catch (error) {
    console.error('Error saving character:', error);
  } finally {
    isSaving.value = false;
  }
}

async function generateArtImage() {
  isGeneratingArt.value = true;
  try {
    const artImageId = await artStore.generateArtImage(character.artPrompt);
    character.artImageId = artImageId;
  } catch (error) {
    console.error('Error generating art image:', error);
  } finally {
    isGeneratingArt.value = false;
  }
}

function rerollStats() {
  for (let i = 1; i <= 6; i++) {
    character[`statValue${i}`] =
      Math.floor(Math.random() * 6 + 1) +
      Math.floor(Math.random() * 6 + 1) +
      Math.floor(Math.random() * 6 + 1);
  }
}

function setArtImageId(artImageId: number) {
  character.artImageId = artImageId;
}
</script>
