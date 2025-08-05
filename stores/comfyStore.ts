// /stores/comfyStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'

interface ComfyStoreState {
  loading: boolean
  error: string
  graphOutput: string | null       // base64 or image path
  prompt: string
  promptB?: string
  promptBlend?: number
  imageData?: string               // base64 input
  maskData?: string               // for inpaint
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
