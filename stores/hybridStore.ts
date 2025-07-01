// /stores/hybridStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { animalDataList } from '@/stores/utils/animalData'
import { usePromptStore } from './promptStore'
import { useArtStore } from './artStore'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'

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

// legacy export compatibility
export const animalList = animalDataList.map((a) => a.name)

export const useHybridStore = defineStore('hybridStore', () => {
  const promptStore = usePromptStore()
  const artStore = useArtStore()
  const userStore = useUserStore()

  const animalOne = ref(animalDataList[0].name)
  const animalTwo = ref(animalDataList[1].name)
  const blendRatio = ref(50)

  const hybridName = ref('')
  const basePrompt = ref('')
  const finalText = ref('')
  const isStreaming = ref(false)

  const generatedArt = ref<any | null>(null)
  const artImage = ref<any | null>(null)

  const history = ref<HybridEntry[]>([])
  const allHybrids = ref<any[]>([])
  const selectedHybrid = ref<any | null>(null)

  const percentA = computed(() => blendRatio.value)
  const percentB = computed(() => 100 - blendRatio.value)

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

  function randomAnimalName(): string {
    const random = () => animalDataList[Math.floor(Math.random() * animalDataList.length)]
    return random().name
  }

  function randomizeAnimals() {
    animalOne.value = randomAnimalName()
    animalTwo.value = randomAnimalName()
  }

  async function fetchTextDirectly() {
    isStreaming.value = true
    finalText.value = ''

    try {
      const processed = promptStore.processPromptPlaceholders(basePrompt.value)
      const res = await performFetch<{ text: string }>('/api/hybrids/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: processed }),
      })
      finalText.value = res.data?.text || '⚠️ No response received.'
    } catch (err) {
      finalText.value = '⚠️ Error generating hybrid description.'
      handleError(err, 'generating hybrid text')
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
    await fetchTextDirectly()
    await generateArtFromText()
  }

  function resetHybrid() {
    animalOne.value = animalDataList[0].name
    animalTwo.value = animalDataList[1].name
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
      if (raw) history.value = JSON.parse(raw)
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

  async function fetchHybrids() {
    try {
      const res = await performFetch<any[]>('/api/hybrids')
      if (res.success && Array.isArray(res.data)) {
        allHybrids.value = res.data
      }
    } catch (err) {
      handleError(err, 'fetching hybrids')
    }
  }

  async function getHybridById(id: number) {
    try {
      const res = await performFetch<any>(`/api/hybrids/${id}`)
      if (res.success) selectedHybrid.value = res.data
    } catch (err) {
      handleError(err, `fetching hybrid ${id}`)
    }
  }

  async function createHybrid() {
    const payload = {
      name: hybridName.value,
      animalOne: animalOne.value,
      animalTwo: animalTwo.value,
      blend: blendRatio.value,
      promptString: basePrompt.value,
      result: finalText.value,
      userId: userStore.userId,
      artId: generatedArt.value?.id,
      artImageId: generatedArt.value?.artImageId || null,
    }

    try {
      const res = await performFetch<any>('/api/hybrids', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res.success && res.data) {
        allHybrids.value.unshift(res.data)
        return res.data
      }
    } catch (err) {
      handleError(err, 'creating hybrid')
    }
  }

  async function updateHybrid(id: number, updates: Partial<any>) {
    try {
      const res = await performFetch<any>(`/api/hybrids/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return res
    } catch (err) {
      handleError(err, `updating hybrid ${id}`)
      return { success: false }
    }
  }

  async function deleteHybrid(id: number) {
    try {
      const res = await performFetch<any>(`/api/hybrids/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        allHybrids.value = allHybrids.value.filter((h) => h.id !== id)
      }
      return res
    } catch (err) {
      handleError(err, `deleting hybrid ${id}`)
      return { success: false }
    }
  }

  if (typeof window !== 'undefined') loadFromLocalStorage()

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
    allHybrids,
    selectedHybrid,

    // computed
    percentA,
    percentB,

    // local actions
    updatePrompt,
    generateHybridName,
    randomizeAnimals,
    fetchTextDirectly,
    generateArtFromText,
    streamTextThenArt,
    resetHybrid,
    saveToHistory,
    loadHybrid,
    syncToLocalStorage,
    loadFromLocalStorage,

    // backend actions
    fetchHybrids,
    getHybridById,
    createHybrid,
    updateHybrid,
    deleteHybrid,
  }
})
