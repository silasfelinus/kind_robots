// /server/api/comfy/pipelines/index.ts

import flux from './flux.json'
import sdxl from './sdxl.json'

import type { ModelType } from '../index'

export const pipelines: Record<ModelType, any> = {
  flux,
  sdxl,
}
