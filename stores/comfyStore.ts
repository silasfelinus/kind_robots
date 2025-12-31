// /stores/comfyStore.ts

import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import { performFetch, handleError } from './utils'

type ModifierType = 'inpaint' | 'outpaint' | 'upscale' | 'morph'

interface ModifierStep {
  id: string
  type: ModifierType
  config: Record<string, any>
}

interface ComfyStoreState {
  loading: boolean
  error: string
  graphOutput: string | null
  inputType: 'text' | 'image'
  prompt: string
  imageData: string
  checkpoint: string
  modifierSteps: ModifierStep[]
  graphResult: any
  isInitialized: boolean
}

let stepCounter = 0
function generateId() {
  return `step-${Date.now().toString(36)}-${(stepCounter++).toString(36)}`
}

const isClient = typeof window !== 'undefined'

export const useComfyStore = defineStore('comfyStore', () => {
  const state = reactive<ComfyStoreState>({
    loading: false,
    error: '',
    graphOutput: null,
    inputType: 'text',
    prompt: '',
    imageData: '',
    checkpoint: 'flux',
    modifierSteps: [],
    graphResult: null,
    isInitialized: false,
  })

  function initialize() {
    if (state.isInitialized || !isClient) return
    try {
      const saved = localStorage.getItem('comfyBlueprint')
      if (saved) Object.assign(state, JSON.parse(saved))
    } catch (e) {
      handleError(e, 'loading comfy blueprint')
    }
    state.isInitialized = true
  }

  function persist() {
    if (!isClient) return
    try {
      localStorage.setItem('comfyBlueprint', JSON.stringify({ ...state }))
    } catch (e) {
      handleError(e, 'saving comfy blueprint')
    }
  }

  function setPrompt(prompt: string) {
    state.prompt = prompt
    persist()
  }

  function setImage(base64: string) {
    state.imageData = base64
    persist()
  }

  function setInputType(type: 'text' | 'image') {
    state.inputType = type
    persist()
  }

  function setCheckpoint(name: string) {
    state.checkpoint = name
    persist()
  }

  function addStep(type: ModifierType) {
    state.modifierSteps.push({
      id: generateId(),
      type,
      config: {},
    })
    persist()
  }

  function removeStep(id: string) {
    state.modifierSteps = state.modifierSteps.filter((s) => s.id !== id)
    persist()
  }

  function moveStepUp(index: number) {
    if (index <= 0) return
    const temp = state.modifierSteps[index]
    state.modifierSteps[index] = state.modifierSteps[index - 1]
    state.modifierSteps[index - 1] = temp
    persist()
  }

  function moveStepDown(index: number) {
    if (index >= state.modifierSteps.length - 1) return
    const temp = state.modifierSteps[index]
    state.modifierSteps[index] = state.modifierSteps[index + 1]
    state.modifierSteps[index + 1] = temp
    persist()
  }

  function updateStepConfig(id: string, config: Record<string, any>) {
    const step = state.modifierSteps.find((s) => s.id === id)
    if (step) {
      step.config = config
      persist()
    }
  }

  function reset() {
    state.prompt = ''
    state.imageData = ''
    state.checkpoint = 'flux'
    state.modifierSteps = []
    persist()
  }

  async function fetchStatus() {
    try {
      const response = await performFetch('/api/comfy?status')
      return response.success ? response.data : null
    } catch (error) {
      handleError(error, 'fetching Comfy status')
    }
  }

  async function fetchModels() {
    try {
      const response = await performFetch('/api/comfy?models')
      return response.success ? response.data : []
    } catch (error) {
      handleError(error, 'fetching Comfy models')
      return []
    }
  }

  async function submitBlueprint() {
    state.loading = true
    state.error = ''
    state.graphOutput = null

    try {
      const payload = {
        inputType: state.inputType,
        prompt: state.prompt,
        imageData: state.imageData,
        checkpoint: state.checkpoint,
        steps: state.modifierSteps,
      }

      const response = await performFetch('/api/comfy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message)
      }

      state.graphResult = response.data
      state.graphOutput = JSON.stringify(response.data, null, 2) // optional pretty output

      persist()
      return { success: true }
    } catch (error) {
      handleError(error, 'submitting comfy blueprint')
      state.error = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, message: state.error }
    } finally {
      state.loading = false
    }
  }

  return {
    ...toRefs(state),
    initialize,
    setPrompt,
    setImage,
    setInputType,
    setCheckpoint,
    addStep,
    removeStep,
    moveStepUp,
    moveStepDown,
    updateStepConfig,
    fetchStatus,
    fetchModels,
    submitBlueprint,
    reset,
    persist,
  }
})

export type { ModifierType }
