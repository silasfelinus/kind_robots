<!-- /components/content/art/animal-hybrid.vue -->
<template>
  <div class="w-full max-w-3xl mx-auto space-y-6 p-4">
    <h1 class="text-2xl font-bold text-center">🦋 Animal Hybrid Lab</h1>

    <!-- Hybrid Name -->
    <div
      v-if="hybridName"
      class="text-center text-xl font-semibold text-accent"
    >
      🧬 Meet the <span class="italic">{{ hybridName }}</span>
    </div>

    <!-- Animal Selectors -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="w-full">
        <label class="label">Animal One</label>
        <select v-model="animalOne" class="select select-bordered w-full">
          <option v-for="a in animalList" :key="a" :value="a">{{ a }}</option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="randomize('one')">
          🎲 Random
        </button>
      </div>
      <div class="w-full">
        <label class="label">Animal Two</label>
        <select v-model="animalTwo" class="select select-bordered w-full">
          <option v-for="a in animalList" :key="a" :value="a">{{ a }}</option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="randomize('two')">
          🎲 Random
        </button>
      </div>
    </div>

    <!-- Blend Ratio -->
    <div class="space-y-2">
      <label class="text-sm font-semibold">⚖️ Blend: {{ blendRatio }}%</label>
      <input
        type="range"
        min="0"
        max="100"
        step="10"
        v-model="blendRatio"
        class="range range-primary"
      />
      <div class="flex justify-between text-xs text-base-content/60">
        <span>{{ animalOne }}</span>
        <span>50/50</span>
        <span>{{ animalTwo }}</span>
      </div>
    </div>

    <!-- Prompt Input & Model Output -->
    <div class="space-y-4">
      <!-- Base Prompt Field -->
      <div>
        <label class="text-sm font-semibold">🧬 Base Hybrid Prompt</label>
        <textarea
          v-model="basePrompt"
          class="textarea textarea-bordered w-full h-32"
          readonly
        />
      </div>

      <!-- Model-Completed Prompt -->
      <div>
        <label class="text-sm font-semibold">🧠 Final AI Text</label>
        <textarea
          v-model="finalPromptString"
          class="textarea textarea-bordered w-full h-40"
          placeholder="Click 'Get Text' to generate detailed hybrid description..."
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-2">
      <button class="btn btn-outline" @click="getText">🧠 Get Text</button>
      <button
        class="btn btn-outline btn-primary"
        @click="getArt"
        :disabled="!generatedPrompt"
      >
        🎨 Get Art
      </button>
      <button class="btn btn-primary" @click="getTextThenArt">
        🚀 Get Text + Art
      </button>
    </div>

    <!-- ArtCard Display -->
    <div v-if="latestArtImage" class="pt-6">
      <h2 class="text-lg font-semibold mb-2 text-center">
        ✨ Your Hybrid Masterpiece
      </h2>
      <art-card :art="latestArt" :image="latestArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { animalList } from '@/stores/utils/randomAnimal'
import { usePromptStore } from '@/stores/promptStore'
import { useArtStore } from '@/stores/artStore'

const promptStore = usePromptStore()
const artStore = useArtStore()

const animalOne = ref(animalList[0])
const animalTwo = ref(animalList[1])
const blendRatio = ref(50)
const generatedPrompt = ref('')
const hybridName = ref('')

const basePrompt = ref('')
const finalPromptString = ref('')

const latestArt = ref()
const latestArtImage = ref()

function randomize(which: 'one' | 'two') {
  const pick = () => animalList[Math.floor(Math.random() * animalList.length)]
  if (which === 'one') animalOne.value = pick()
  if (which === 'two') animalTwo.value = pick()
}

function generateHybridName(a1: string, a2: string): string {
  const lower = (s: string) => s.toLowerCase().replace(/\s+/g, '')
  const part1 = lower(a1).slice(0, Math.max(3, Math.floor(a1.length / 2)))
  const part2 = lower(a2).slice(-Math.max(3, Math.floor(a2.length / 2)))
  return capitalize(part1 + part2)
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function getText() {
  const percentA = blendRatio.value
  const percentB = 100 - percentA
  const staticPrompt = `A hybrid creature that is ${percentA}% ${animalOne.value} and ${percentB}% ${animalTwo.value}, featuring distinct visual features from both. Include details about its appearance, textures, abilities, and environment.`

  basePrompt.value = staticPrompt
  hybridName.value = generateHybridName(animalOne.value, animalTwo.value)

  try {
    finalPromptString.value = ''
    const processed = promptStore.processPromptPlaceholders(staticPrompt)
    await promptStore.streamPromptCompletion(processed)
    finalPromptString.value = promptStore.streamedText
  } catch (err) {
    finalPromptString.value = '⚠️ Failed to generate AI description.'
  }
}

async function getArt() {
  if (!generatedPrompt.value) return

  const response = await artStore.generateArt({
    promptString: generatedPrompt.value,
    pitch: 'animal hybrid',
    checkpoint: 'stable-diffusion-v1-4', // ← actual model name
    collection: 'hybrids', // ← assigned collection
    designer: 'Hybrid Lab',
    isPublic: true,
    isMature: false,
  })

  if (response.success && response.data) {
    const art = response.data
    const image = artStore.getArtImageByArtId(art.id)
    latestArt.value = art
    latestArtImage.value = image
  }
}

async function getTextThenArt() {
  getText()
  await getArt()
}
</script>
