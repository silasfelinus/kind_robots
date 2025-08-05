// /stores/comfyStore.ts

import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'

interface ComfyStoreState {
  loading: boolean
  error: string
  graphOutput: string | null
  prompt: string
  promptB?: string
  promptBlend?: number
  imageData?: string
  maskData?: string
  modelType: 'flux' | 'sdxl'
  controlType?: 'canny' | 'scribble' | 'depth' | 'custom'
  denoise?: number
  strength?: number
  width?: number
  height?: number
  seed?: number
  useInpaint: boolean
  useOutpaint: boolean
  useUpscale: boolean
  useMorph: boolean
  lastSubmittedGraph?: any
  isInitialized: boolean
}

const isClient = typeof window !== 'undefined'

export const useComfyStore = defineStore('comfyStore', () => {
  const state = reactive<ComfyStoreState>({
    loading: false,
    error: '',
    graphOutput: null,
    prompt: '',
    promptB: '',
    promptBlend: 0.5,
    imageData: '',
    maskData: '',
    modelType: 'flux',
    controlType: undefined,
    denoise: 1,
    strength: 0.65,
    width: 768,
    height: 1024,
    seed: undefined,
    useInpaint: false,
    useOutpaint: false,
    useUpscale: false,
    useMorph: false,
    lastSubmittedGraph: undefined,
    isInitialized: false,
  })

  function initialize() {
    if (state.isInitialized || !isClient) return
    try {
      const saved = localStorage.getItem('comfyInputs')
      if (saved) {
        Object.assign(state, JSON.parse(saved))
      }
    } catch (error) {
      handleError(error, 'initializing comfyStore')
    }
    state.isInitialized = true
  }

  function persistInputs() {
    if (!isClient) return
    try {
      localStorage.setItem('comfyInputs', JSON.stringify({ ...state }))
    } catch (error) {
      handleError(error, 'saving comfy inputs')
    }
  }

  function setPrompt(prompt: string) {
    state.prompt = prompt
    persistInputs()
  }

  function setPromptB(promptB: string, blend = 0.5) {
    state.promptB = promptB
    state.promptBlend = blend
    persistInputs()
  }

  function setImage(base64: string) {
    state.imageData = base64
    persistInputs()
  }

  function setMask(base64: string) {
    state.maskData = base64
    persistInputs()
  }

  function toggleInpaint(value = true) {
    state.useInpaint = value
    persistInputs()
  }

  function toggleUpscale(value = true) {
    state.useUpscale = value
    persistInputs()
  }

  function toggleOutpaint(value = true) {
    state.useOutpaint = value
    persistInputs()
  }

  function toggleMorph(value = true) {
    state.useMorph = value
    persistInputs()
  }

  function resetInputs() {
    state.prompt = ''
    state.promptB = ''
    state.promptBlend = 0.5
    state.imageData = ''
    state.maskData = ''
    state.controlType = undefined
    state.useInpaint = false
    state.useOutpaint = false
    state.useUpscale = false
    state.useMorph = false
    persistInputs()
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

  async function submitGraph() {
    state.loading = true
    state.error = ''
    state.graphOutput = null

    try {
      const userStore = useUserStore()

      const payload = {
        modelType: state.modelType,
        prompt: state.prompt,
        promptB: state.promptB,
        promptBlend: state.promptBlend,
        imageData: state.imageData,
        maskData: state.maskData,
        controlType: state.controlType,
        useInpaint: state.useInpaint,
        useOutpaint: state.useOutpaint,
        useUpscale: state.useUpscale,
        useMorph: state.useMorph,
        denoise: state.denoise,
        strength: state.strength,
        width: state.width,
        height: state.height,
        seed: state.seed ?? Math.floor(Math.random() * 1e15),
      }

      const response = await performFetch('/api/comfy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message)
      }

      state.lastSubmittedGraph = response.data
      state.graphOutput = response.data.output || null

      persistInputs()
      return { success: true, graph: response.data }
    } catch (error) {
      handleError(error, 'submitting comfy graph')
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
    setPromptB,
    setImage,
    setMask,
    toggleInpaint,
    toggleUpscale,
    toggleOutpaint,
    toggleMorph,
    resetInputs,
    fetchStatus,
    fetchModels,
    submitGraph,
    persistInputs,
  }
})
