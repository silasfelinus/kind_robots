<!-- /components/content/art/animal-hybrid.vue -->
<template>
  <div class="w-full max-w-3xl mx-auto space-y-6 p-4">
    <h1 class="text-2xl font-bold text-center">🦋 Animal Hybrid Lab</h1>

    <!-- Hybrid Name -->
    <div v-if="store.hybridName" class="text-center text-xl font-semibold text-accent">
      🧬 Meet the <span class="italic">{{ store.hybridName }}</span>
    </div>

    <!-- Animal Selectors -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="w-full">
        <label class="label">Animal One</label>
        <select v-model="store.animalOne" class="select select-bordered w-full">
          <option
            v-for="animal in animalDataList"
            :key="animal.name"
            :value="animal.name"
          >
            {{ animal.icon || '🐾' }} {{ animal.name }}
          </option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="store.randomizeAnimals()">🎲 Random</button>
      </div>
      <div class="w-full">
        <label class="label">Animal Two</label>
        <select v-model="store.animalTwo" class="select select-bordered w-full">
          <option
            v-for="animal in animalDataList"
            :key="animal.name"
            :value="animal.name"
          >
            {{ animal.icon || '🐾' }} {{ animal.name }}
          </option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="store.randomizeAnimals()">🎲 Random</button>
      </div>
    </div>

    <!-- Blend Ratio -->
    <div class="space-y-2">
      <label class="text-sm font-semibold">⚖️ Blend: {{ store.blendRatio }}%</label>
      <input
        type="range"
        min="0"
        max="100"
        step="10"
        v-model="store.blendRatio"
        class="range range-primary"
      />
      <div class="flex justify-between text-xs text-base-content/60">
        <span>{{ store.animalOne }}</span>
        <span>50/50</span>
        <span>{{ store.animalTwo }}</span>
      </div>
    </div>

    <!-- Prompt Input & Model Output -->
    <div class="space-y-4">
      <div>
        <label class="text-sm font-semibold">🧬 Base Hybrid Prompt</label>
        <textarea
          v-model="store.basePrompt"
          class="textarea textarea-bordered w-full h-32"
        />
      </div>

      <div>
        <label class="text-sm font-semibold">🧠 Final AI Text</label>
        <textarea
          :value="store.finalText"
          class="textarea textarea-bordered w-full h-40"
          placeholder="Click 'Get Text' to generate detailed hybrid description..."
          readonly
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-2">
      <button class="btn btn-outline" @click="getText" :disabled="store.isStreaming">
        <span v-if="store.isStreaming" class="loading loading-spinner loading-xs mr-2" />
        🧠 Get Text
      </button>

      <button
        class="btn btn-outline btn-primary"
        @click="getArt"
        :disabled="!store.finalText || store.isStreaming"
      >
        🎨 Get Art
      </button>

      <button class="btn btn-primary" @click="getTextThenArt" :disabled="store.isStreaming">
        🚀 Get Text + Art
      </button>
    </div>

    <!-- ArtCard Display -->
    <div v-if="store.artImage" class="pt-6">
      <h2 class="text-lg font-semibold mb-2 text-center">✨ Your Hybrid Masterpiece</h2>
      <art-card :art="store.generatedArt" :image="store.artImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useHybridStore } from '@/stores/hybridStore'
import { animalDataList } from '@/stores/utils/animalData'

const store = useHybridStore()

watch(
  [() => store.animalOne, () => store.animalTwo, () => store.blendRatio],
  () => {
    store.updatePrompt()
  },
  { immediate: true }
)

async function getText() {
  await store.fetchTextDirectly()
}

async function getArt() {
  await store.generateArtFromText()
}

async function getTextThenArt() {
  await getText()
  await getArt()
}
</script>
