// /stores/startupAnimationStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStartupAnimationStore = defineStore(
  'startupAnimationStore',
  () => {
    const immersive = ref(false)
    const controlsActive = ref(false)
    const exitRequest = ref(0)

    function setImmersive(value: boolean): void {
      immersive.value = value
    }

    function enterControlMode(): void {
      controlsActive.value = true
      immersive.value = true
    }

    function leaveControlMode(): void {
      controlsActive.value = false
      immersive.value = false
    }

    function requestExit(): void {
      controlsActive.value = false
      immersive.value = false
      exitRequest.value += 1
    }

    function reset(): void {
      controlsActive.value = false
      immersive.value = false
      exitRequest.value = 0
    }

    return {
      immersive,
      controlsActive,
      exitRequest,
      setImmersive,
      enterControlMode,
      leaveControlMode,
      requestExit,
      reset,
    }
  },
)
