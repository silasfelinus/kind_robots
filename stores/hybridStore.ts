// /stores/hybridStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { animalList } from '@/stores/utils/randomAnimal'
import { usePromptStore } from './promptStore'
import { useArtStore } from './artStore'

export type HybridEntry = {
  id: string
  animalOne: string
  animalTwo: string
  blendRatio: number
  name: string
  prompt: string
  aiText: string
  artId?: number
  timestamp: number
}

const localStorageKey = 'hybridHistory'

export const useHybridStore = defineStore('hybridStore', () => {
  const promptStore = usePromptStore()
  const artStore = useArtStore()

  const animalOne = ref(animalList[0])
  const animalTwo = ref(animalList[1])
  const blendRatio = ref(50)

  const hybridName = ref('')
  const basePrompt = ref('')
  const finalText = ref('')
  const isStreaming = ref(false)

  const generatedArt = ref<any | null>(null)
  const artImage = ref<any | null>(null)

  const history = ref<HybridEntry[]>([])

  const percentA = computed(() => blendRatio.value)
  const percentB = computed(() => 100 - blendRatio.value)

  // Auto-update hybridName + prompt
  watch([animalOne, animalTwo, blendRatio], () => {
    updatePrompt()
  })

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function generateHybridName(a1: string, a2: string) {
    const lower = (s: string) => s.toLowerCase().replace(/\s+/g, '')
    const part1 = lower(a1).slice(0, Math.max(3, Math.floor(a1.length / 2)))
    const part2 = lower(a2).slice(-Math.max(3, Math.floor(a2.length / 2)))
    return capitalize(part1 + part2)
  }

  function updatePrompt() {
    const a = animalOne.value
    const b = animalTwo.value
    hybridName.value = generateHybridName(a, b)
    basePrompt.value = `A hybrid creature that is ${percentA.value}% ${a} and ${percentB.value}% ${b}, featuring distinct visual features from both. Include details about its appearance, textures, abilities, and environment.`
  }

  function randomizeAnimals() {
    const random = () => animalList[Math.floor(Math.random() * animalList.length)]
    animalOne.value = random()
    animalTwo.value = random()
  }

async function fetchTextDirectly() {
  isStreaming.value = true
  finalText.value = ''

  try {
    const processed = promptStore.processPromptPlaceholders(basePrompt.value)
    const res = await fetch('/api/hybrids/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: processed }),
    })

    if (!res.ok) throw new Error('GPT request failed')
    const { text } = await res.json()
    finalText.value = text || '⚠️ No response received.'
  } catch (err) {
    finalText.value = '⚠️ Error generating hybrid description.'
    console.error(err)
  } finally {
    isStreaming.value = false
  }
}


  async function streamText() {
    isStreaming.value = true
    finalText.value = ''
    try {
      const processed = promptStore.processPromptPlaceholders(basePrompt.value)
      finalText.value = await promptStore.streamPromptCompletion(processed)
    } catch (err) {
      finalText.value = '⚠️ Error generating hybrid description.'
    } finally {
      isStreaming.value = false
    }
  }

  async function generateArtFromText() {
    if (!finalText.value) return

    const response = await artStore.generateArt({
      promptString: finalText.value,
      pitch: 'animal hybrid',
      checkpoint: 'stable-diffusion-v1-4',
      collection: 'hybrids',
      designer: 'Hybrid Lab',
      isPublic: true,
      isMature: false,
    })

    if (response.success && response.data) {
      generatedArt.value = response.data
      artImage.value = artStore.getArtImageByArtId(response.data.id)
    }
  }

  async function streamTextThenArt() {
    await streamText()
    await generateArtFromText()
  }

  function resetHybrid() {
    animalOne.value = animalList[0]
    animalTwo.value = animalList[1]
    blendRatio.value = 50
    hybridName.value = ''
    basePrompt.value = ''
    finalText.value = ''
    generatedArt.value = null
    artImage.value = null
  }

  function saveToHistory() {
    const entry: HybridEntry = {
      id: crypto.randomUUID(),
      animalOne: animalOne.value,
      animalTwo: animalTwo.value,
      blendRatio: blendRatio.value,
      name: hybridName.value,
      prompt: basePrompt.value,
      aiText: finalText.value,
      artId: generatedArt.value?.id,
      timestamp: Date.now(),
    }
    history.value.unshift(entry)
    syncToLocalStorage()
  }

  function loadHybrid(entry: HybridEntry) {
    animalOne.value = entry.animalOne
    animalTwo.value = entry.animalTwo
    blendRatio.value = entry.blendRatio
    hybridName.value = entry.name
    basePrompt.value = entry.prompt
    finalText.value = entry.aiText
    generatedArt.value = null
    artImage.value = null
    if (entry.artId) {
      artImage.value = artStore.getArtImageByArtId(entry.artId)
    }
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(localStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          history.value = parsed
        }
      }
    } catch (err) {
      console.warn('Failed to load hybrid history:', err)
    }
  }

  function syncToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(history.value))
    } catch (err) {
      console.warn('Failed to sync hybrid history:', err)
    }
  }

  // Initialize history on client
  if (typeof window !== 'undefined') {
    loadFromLocalStorage()
  }

  return {
    // state
    animalOne,
    animalTwo,
    blendRatio,
    hybridName,
    basePrompt,
    finalText,
    isStreaming,
    generatedArt,
    artImage,
    history,

    // computed
    percentA,
    percentB,

    // actions
    updatePrompt,
    generateHybridName,
    randomizeAnimals,
    streamText,
    generateArtFromText,
    streamTextThenArt,
    resetHybrid,
    saveToHistory,
    loadHybrid,
    syncToLocalStorage,
    loadFromLocalStorage,
fetchTextDirectly,
  }
})
