// /stores/startupAnimationStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStartupAnimationStore = defineStore(
  'startupAnimationStore',
  () => {
    const immersive = ref(false)
    const exitRequest = ref(0)

    function setImmersive(value: boolean): void {
      immersive.value = value
    }

    function toggleImmersive(): void {
      immersive.value = !immersive.value
    }

    function requestExit(): void {
      immersive.value = false
      exitRequest.value += 1
    }

    function reset(): void {
      immersive.value = false
      exitRequest.value = 0
    }

    return {
      immersive,
      exitRequest,
      setImmersive,
      toggleImmersive,
      requestExit,
      reset,
    }
  },
)
