import {
  buildSdxlImg2ImgWorkflow,
  sdxlSamplerProfile,
  type ComfyWorkflow,
} from './workflow'

export type SdxlRegionWorkflowInput = {
  prompt: string
  negativePrompt?: string
  sourceName: string
  originalName: string
  noiseMaskName: string
  compositeMaskName: string
  checkpoint: string
  steps?: number
  cfg?: number
  denoise?: number
  seed?: number
  sampler?: string
  scheduler?: string
  originalWidth: number
  originalHeight: number
  crop: { x: number; y: number; width: number; height: number }
  filenamePrefix?: string
}

export function buildSdxlRegionWorkflow(input: SdxlRegionWorkflowInput): {
  workflow: ComfyWorkflow
  seed: number
} {
  const profile = sdxlSamplerProfile(input.checkpoint)
  const built = buildSdxlImg2ImgWorkflow({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    imageName: input.sourceName,
    checkpoint: input.checkpoint,
    steps: input.steps ?? profile.steps,
    cfgValue: input.cfg ?? profile.cfg,
    denoise: input.denoise ?? 0.65,
    seed: input.seed,
    sampler: input.sampler ?? profile.sampler,
    scheduler: input.scheduler ?? profile.scheduler,
    filenamePrefix: input.filenamePrefix ?? 'kindrobots_region_inpaint',
  })
  const workflow = built.workflow

  workflow['80'] = {
    class_type: 'LoadImageMask',
    inputs: { image: input.noiseMaskName, channel: 'red' },
  }
  workflow['81'] = {
    class_type: 'SetLatentNoiseMask',
    inputs: { samples: ['5', 0], mask: ['80', 0] },
  }
  workflow['82'] = {
    class_type: 'LoadImageMask',
    inputs: { image: input.compositeMaskName, channel: 'red' },
  }
  workflow['90'] = {
    class_type: 'LoadImage',
    inputs: { image: input.originalName },
  }
  workflow['83'] = {
    class_type: 'ImageCompositeMasked',
    inputs: {
      destination: ['90', 0],
      source: ['7', 0],
      x: input.crop.x,
      y: input.crop.y,
      resize_source: false,
      mask: ['82', 0],
    },
  }
  workflow['84'] = {
    class_type: 'ImageCrop',
    inputs: {
      image: ['83', 0],
      width: input.originalWidth,
      height: input.originalHeight,
      x: 0,
      y: 0,
    },
  }
  workflow['6']!.inputs!.latent_image = ['81', 0]
  workflow['8']!.inputs!.images = ['84', 0]

  return { workflow, seed: built.seed }
}
