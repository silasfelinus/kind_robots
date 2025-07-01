<!-- /components/content/hybrids/generate-hybrid.vue -->
<template>
  <div class="space-y-8 p-4 max-w-5xl mx-auto">
    <!-- Hybrid Name -->
    <transition name="fade-scale">
      <div
        v-if="store.hybridName"
        class="text-center text-xl font-semibold text-accent"
        key="hybrid-name"
      >
        🧬 Meet the <span class="italic">{{ store.hybridName }}</span>
      </div>
    </transition>

    <!-- Animal Inputs -->
    <div class="flex flex-col md:flex-row gap-6 items-start">
      <animal-picker
        label="Animal One"
        v-model="store.animalOne"
        :target="'animalOne'"
        @click-random="store.randomizeAnimals"
      />
      <div class="flex items-center justify-center">
        <button
          class="btn btn-circle btn-outline tooltip"
          data-tip="Swap Animals"
          @click="swapAnimals"
        >
          🔄
        </button>
      </div>
      <animal-picker
        label="Animal Two"
        v-model="store.animalTwo"
        :target="'animalTwo'"
        @click-random="store.randomizeAnimals"
      />
    </div>

    <!-- Blend Slider -->
    <div class="space-y-2">
      <label class="text-sm font-semibold">
        ⚖️ Blend: {{ store.blendRatio }}%
      </label>
      <input
        type="range"
        min="0"
        max="100"
        step="10"
        v-model="store.blendRatio"
        class="range range-primary"
      />
      <div class="flex justify-between text-xs text-base-content/60 font-mono">
        <span>{{ store.animalOne }}</span>
        <span>50/50</span>
        <span>{{ store.animalTwo }}</span>
      </div>
      <div class="w-full h-2 bg-base-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-accent transition-all duration-300"
          :style="{ width: store.blendRatio + '%' }"
        />
      </div>
    </div>

    <!-- Prompt and Output -->
    <div class="space-y-4">
      <div>
        <label class="text-sm font-semibold">🧬 Prompt Preview</label>
        <textarea
          v-model="store.basePrompt"
          class="textarea textarea-bordered w-full h-28"
        />
      </div>
      <div>
        <label class="text-sm font-semibold">🧠 Final AI Text</label>
        <textarea
          :value="store.finalText"
          class="textarea textarea-bordered w-full h-36"
          readonly
          placeholder="Click 'Get Text' to generate hybrid details..."
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-3 pt-2">
      <button
        class="btn btn-outline"
        @click="getText"
        :disabled="store.isStreaming"
      >
        <span
          v-if="store.isStreaming"
          class="loading loading-spinner loading-xs mr-2"
        />
        🧠 Get Text
      </button>

      <button
        class="btn btn-outline btn-primary"
        @click="getArt"
        :disabled="!store.finalText || store.isStreaming"
      >
        🎨 Get Art
      </button>

      <button
        class="btn btn-primary"
        @click="getTextThenArt"
        :disabled="store.isStreaming"
      >
        🚀 Text + Art
      </button>

      <button
        class="btn btn-outline btn-accent"
        @click="store.randomizeAnimals()"
      >
        🎲 Surprise Me
      </button>
    </div>

    <!-- Final Art -->
    <div v-if="store.artImage" class="pt-8">
      <h2 class="text-lg font-semibold mb-2 text-center">
        ✨ Your Hybrid Masterpiece
      </h2>
      <art-card :art="store.generatedArt" :image="store.artImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useHybridStore } from '@/stores/hybridStore'

const store = useHybridStore()

function swapAnimals() {
  const temp = store.animalOne
  store.animalOne = store.animalTwo
  store.animalTwo = temp
}

watch(
  [() => store.animalOne, () => store.animalTwo, () => store.blendRatio],
  () => {
    store.updatePrompt()
  },
  { immediate: true },
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

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
