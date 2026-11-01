// /stores/rebelButtonStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { rebelStageFor } from '~/utils/rebelButtonStage'

const TOP_SCORE_KEY = 'topScore'

function newSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}

function readStoredTopScore(): number {
  try {
    return parseInt(localStorage.getItem(TOP_SCORE_KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

export const useRebelButtonStore = defineStore('rebelButton', () => {
  const pressCount = ref(0)
  const topScore = ref(0)
  const seed = ref(newSeed())

  const stage = computed(() => rebelStageFor(pressCount.value, seed.value))

  function saveTopScore() {
    try {
      localStorage.setItem(TOP_SCORE_KEY, topScore.value.toString())
    } catch {
      /* storage unavailable: the score stays in memory */
    }
  }

  function loadTopScore(floor = 0) {
    topScore.value = Math.max(floor, readStoredTopScore())
    saveTopScore()
  }

  function press() {
    pressCount.value++
    if (pressCount.value > topScore.value) topScore.value = pressCount.value
    return pressCount.value
  }

  function reset() {
    pressCount.value = 0
    topScore.value = 0
    seed.value = newSeed()
    try {
      localStorage.removeItem(TOP_SCORE_KEY)
    } catch {
      /* ignore */
    }
  }

  return {
    pressCount,
    topScore,
    seed,
    stage,
    loadTopScore,
    saveTopScore,
    press,
    reset,
  }
})
