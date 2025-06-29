<!-- /components/content/art/animal-hybrid.vue -->
<template>
  <div class="w-full max-w-3xl mx-auto space-y-6 p-4">
    <!-- Title -->
    <h1 class="text-2xl font-bold text-center">🐾 Animal Hybrid Creator</h1>

    <!-- Animal Selectors -->
    <div class="flex flex-col md:flex-row gap-4 justify-between">
      <div class="w-full space-y-1">
        <label class="text-sm font-semibold">Animal One</label>
        <select v-model="animalOne" class="select select-bordered w-full">
          <option v-for="a in animalList" :key="a" :value="a">{{ a }}</option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="randomize('one')">
          🎲 Random
        </button>
      </div>

      <div class="w-full space-y-1">
        <label class="text-sm font-semibold">Animal Two</label>
        <select v-model="animalTwo" class="select select-bordered w-full">
          <option v-for="a in animalList" :key="a" :value="a">{{ a }}</option>
        </select>
        <button class="btn btn-sm w-full mt-1" @click="randomize('two')">
          🎲 Random
        </button>
      </div>
    </div>

    <!-- Blend Slider -->
    <div class="space-y-2">
      <label class="text-sm font-semibold">⚖️ Blend: {{ blendRatio }}%</label>
      <input type="range" min="0" max="100" step="10" v-model="blendRatio" class="range range-primary" />
      <div class="flex justify-between text-xs text-base-content/60">
        <span>{{ animalOne || 'Animal One' }}</span>
        <span>50/50</span>
        <span>{{ animalTwo || 'Animal Two' }}</span>
      </div>
    </div>

    <!-- Prompt Box -->
    <div class="space-y-1">
      <label class="text-sm font-semibold">📝 Generated Prompt</label>
      <textarea v-model="generatedPrompt" class="textarea textarea-bordered w-full h-40" />
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-2">
      <button class="btn btn-outline" @click="getText">🧠 Get Text</button>
      <button class="btn btn-outline btn-primary" @click="getArt" :disabled="!generatedPrompt">
        🎨 Get Art
      </button>
      <button class="btn btn-primary" @click="getTextThenArt">🚀 Get Text + Art</button>
    </div>

    <!-- Display Result -->
    <div v-if="latestArtImage" class="pt-6">
      <h2 class="text-lg font-semibold mb-2 text-center">✨ Your Hybrid Masterpiece</h2>
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

const latestArt = ref()
const latestArtImage = ref()

function randomize(target: 'one' | 'two') {
  const pick = () => animalList[Math.floor(Math.random() * animalList.length)]
  if (target === 'one') animalOne.value = pick()
  if (target === 'two') animalTwo.value = pick()
}

async function getText() {
  const percentA = blendRatio.value
  const percentB = 100 - percentA
  const msg = `Write an imaginative and vivid text-to-image prompt to describe a hybrid creature that is ${percentA}% ${animalOne.value} and ${percentB}% ${animalTwo.value}. Describe features, textures, behavior, and environment as if for an art generator.`
  const { text } = await promptStore.getGptText(msg)
  generatedPrompt.value = text
}

async function getArt() {
  const prompt = generatedPrompt.value
  if (!prompt) return

  const response = await artStore.generateArt({
    promptString: prompt,
    pitch: 'animal hybrid',
    designer: 'Hybrid Lab',
    isPublic: true,
    isMature: false,
    checkpoint: 'hybrids',
  })

  if (response.success && response.data) {
    const art = response.data
    const image = artStore.getArtImageByArtId(art.id)
    latestArt.value = art
    latestArtImage.value = image
  }
}

async function getTextThenArt() {
  await getText()
  await getArt()
}
</script>