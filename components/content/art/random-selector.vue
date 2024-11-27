<template>
  <div class="p-6 space-y-4 bg-base-200 rounded-lg shadow-lg">
    <!-- Radial Selector -->
    <div class="flex justify-center space-x-4">
      <label v-for="mode in modes" :key="mode" class="cursor-pointer">
        <input
          v-model="selectedMode"
          type="radio"
          :value="mode"
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
              class="btn btn-sm btn-primary"
              @click="
                () => {
                  if (selectedMode === 'full') addFull(pitch.title)
                  else if (selectedMode === 'choice')
                    toggleDialog(pitch.id, true)
                  else if (selectedMode === 'random') addRandom(pitch.title)
                }
              "
            >
              Add
            </button>
          </div>

          <!-- Choice Modal -->
          <div
            v-if="dialogState[pitch.id]"
            class="modal modal-bottom sm:modal-middle"
          >
            <div class="modal-box">
              <h3 class="font-bold text-lg">Select an Example</h3>
              <ul class="mt-4 space-y-2">
                <li
                  v-for="example in pitch.examples
                    ? pitch.examples.split('|')
                    : []"
                  :key="example"
                  class="cursor-pointer hover:bg-base-300 p-2 rounded"
                  @click="
                    () => {
                      addChoice(example)
                      toggleDialog(pitch.id, false)
                    }
                  "
                >
                  {{ example.trim() }}
                </li>
              </ul>
              <div class="modal-action">
                <button
                  class="btn"
                  @click="() => toggleDialog(pitch.id, false)"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePromptStore } from '~/stores/promptStore'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()
const promptStore = usePromptStore()

const modes = ['full', 'choice', 'random']
const selectedMode = ref('full')

// Get RANDOMLIST pitches
const randomListPitches = computed(() => pitchStore.randomListPitches)

const addToPrompt = (text: string) => {
  if (!promptStore.currentPrompt) promptStore.currentPrompt = '' // Initialize if null/undefined
  promptStore.currentPrompt += ` ${text}`
}

const addFull = (pitchTitle: string | null) => {
  if (pitchTitle) {
    addToPrompt(`__${pitchTitle}__`)
  } else {
    console.warn('Pitch title is null.')
  }
}

const addRandom = (pitchTitle: string | null) => {
  if (pitchTitle) {
    const randomEntry = pitchStore.randomEntry(pitchTitle)
    if (randomEntry) {
      addToPrompt(randomEntry)
    } else {
      console.warn(`No random entry found for "${pitchTitle}".`)
    }
  } else {
    console.warn('Pitch title is null.')
  }
}

// Handle Choice mode
const addChoice = (example: string) => {
  addToPrompt(example)
}

// Reactive state for dialog visibility
const dialogState = ref<Record<number, boolean>>({})

const toggleDialog = (id: number, isOpen: boolean) => {
  dialogState.value[id] = isOpen
}
</script>
