<template>
  <div class="p-6 space-y-4 bg-base-200 rounded-lg shadow-lg">
    <!-- Radial Selector -->
    <div class="flex justify-center space-x-4">
      <label v-for="mode in modes" :key="mode" class="cursor-pointer">
        <input
          type="radio"
          :value="mode"
          v-model="selectedMode"
          class="radio radio-primary"
        />
        <span class="ml-2 capitalize">{{ mode }}</span>
      </label>
    </div>

    <!-- Pitch List -->
    <div>
      <h2 class="text-lg font-bold mb-4">Random List Pitches</h2>
      <ul class="space-y-2">
        <li
          v-for="pitch in randomListPitches"
          :key="pitch.id"
          class="bg-base-100 p-4 rounded-lg shadow cursor-pointer hover:bg-primary hover:text-primary-content transition"
        >
          <div class="flex justify-between items-center">
            <span class="font-semibold">{{ pitch.title }}</span>
            <button
              @click="() => {
                if (selectedMode === 'full') addFull(pitch.title);
                else if (selectedMode === 'choice') $refs[`choice_${pitch.id}`].showModal();
                else if (selectedMode === 'random') addRandom(pitch.title);
              }"
              class="btn btn-sm btn-primary"
            >
              Add
            </button>
          </div>

          <!-- Choice Modal -->
          <dialog
            ref="choice_{{ pitch.id }}"
            class="modal modal-bottom sm:modal-middle"
          >
            <div class="modal-box">
              <h3 class="font-bold text-lg">Select an Example</h3>
              <ul class="mt-4 space-y-2">
                <li
                  v-for="example in pitch.examples.split('|')"
                  :key="example"
                  class="cursor-pointer hover:bg-base-300 p-2 rounded"
                  @click="() => {
                    addChoice(example);
                    $refs[`choice_${pitch.id}`].close();
                  }"
                >
                  {{ example.trim() }}
                </li>
              </ul>
              <div class="modal-action">
                <button class="btn" @click="() => $refs[`choice_${pitch.id}`].close()">Close</button>
              </div>
            </div>
          </dialog>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePromptStore } from '~/stores/promptStore';
import { usePitchStore } from '~/stores/pitchStore';

const pitchStore = usePitchStore();
const promptStore = usePromptStore();

// Radial selection options
const modes = ['full', 'choice', 'random'];
const selectedMode = ref('full');

// Get RANDOMLIST pitches
const randomListPitches = computed(() => pitchStore.randomListPitches);

// Update the prompt string
const addToPrompt = (text: string) => {
  promptStore.promptString += ` ${text}`;
};

// Handle Full mode
const addFull = (pitchTitle: string) => {
  addToPrompt(`__${pitchTitle}__`);
};

// Handle Choice mode
const addChoice = (example: string) => {
  addToPrompt(example);
};

// Handle Random mode
const addRandom = (pitchTitle: string) => {
  const randomEntry = pitchStore.randomEntry(pitchTitle);
  addToPrompt(randomEntry);
};
</script>

