export type ModelType = 'flux' | 'sdxl'
export type ControlType = 'depth' | 'scribble' | 'canny' | 'custom'

export interface BuildGraphInput {
  modelType: ModelType
  prompt: string
  promptB?: string
  imageData?: string // base64
  maskData?: string // base64
  controlType?: ControlType
  loraName?: string
  useInpaint?: boolean
  useOutpaint?: boolean
  useUpscale?: boolean
  useMorph?: boolean
  denoise?: number
  strength?: number
  width?: number
  height?: number
  seed?: number
}
