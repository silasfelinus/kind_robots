export type VideoEngine = 'ltx' | 'wan'
export type VideoOutputFormat = 'webp' | 'mp4' | 'webm'
export type VideoRuntimeTier = 'quick' | 'balanced' | 'slow' | 'very-slow'

export type VideoPresetDefinition = {
  id: string
  engine: VideoEngine
  label: string
  description: string
  width: number
  height: number
  durationSeconds: number
  fps: number
  loop: boolean
  outputFormat: VideoOutputFormat
  renderScale: number
  latentUpscaleModel: string | null
  refineSampler: string | null
  refineSigmas: string | null
  timeoutSeconds: number
  runtimeTier: VideoRuntimeTier
  runtimeHint: string
}

export type VideoWorkloadInput = {
  engine: VideoEngine
  width: number
  height: number
  durationSeconds: number
  fps: number
  renderScale?: number | null
  latentUpscaleModel?: string | null
}

export const LTX_23_SPATIAL_UPSCALER =
  'ltx-2.3-spatial-upscaler-x2-1.1.safetensors'

export const VIDEO_PRESETS = [
  {
    id: 'ltx-12gb-balanced',
    engine: 'ltx',
    label: '12 GB Balanced',
    description:
      '1280×720 output, 4 seconds at 16 FPS. Diffuses at half resolution, then uses LTX native x2 latent upscale + refinement.',
    width: 1280,
    height: 720,
    durationSeconds: 4,
    fps: 16,
    loop: true,
    outputFormat: 'webp',
    renderScale: 0.5,
    latentUpscaleModel: LTX_23_SPATIAL_UPSCALER,
    refineSampler: 'euler_cfg_pp',
    refineSigmas: '0.85, 0.7250, 0.4219, 0.0',
    timeoutSeconds: 5_400,
    runtimeTier: 'balanced',
    runtimeHint:
      'Default for the 12 GB studio card. It trades a little extra refinement work for dramatically lower first-pass VRAM pressure.',
  },
  {
    id: 'ltx-12gb-quick',
    engine: 'ltx',
    label: '12 GB Quick',
    description: '768×432, 3 seconds at 16 FPS. Direct low-resolution render.',
    width: 768,
    height: 432,
    durationSeconds: 3,
    fps: 16,
    loop: true,
    outputFormat: 'webp',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 3_600,
    runtimeTier: 'quick',
    runtimeHint:
      'Fastest practical LTX preset on the 12 GB card. Best for motion tests and iteration.',
  },
  {
    id: 'ltx-full-quality',
    engine: 'ltx',
    label: 'Full-res Quality',
    description:
      '1280×720, 6 seconds at 25 FPS with direct full-resolution diffusion.',
    width: 1280,
    height: 720,
    durationSeconds: 6,
    fps: 25,
    loop: false,
    outputFormat: 'mp4',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 14_400,
    runtimeTier: 'very-slow',
    runtimeHint:
      'Maximum direct quality, but the 22B model substantially exceeds 12 GB VRAM. Expect a multi-hour render on the studio RTX 3060.',
  },
  {
    id: 'ltx-startup-webp',
    engine: 'ltx',
    label: 'Startup WebP',
    description: '768×768, 2.5 seconds, 16 FPS, looping animated WebP.',
    width: 768,
    height: 768,
    durationSeconds: 2.5,
    fps: 16,
    loop: true,
    outputFormat: 'webp',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 3_600,
    runtimeTier: 'quick',
    runtimeHint: 'Short square clip intended for startup/loading animations.',
  },
  {
    id: 'ltx-startup-webm',
    engine: 'ltx',
    label: 'Startup WebM',
    description: '768×768, 2.5 seconds, 16 FPS, looping WebM video.',
    width: 768,
    height: 768,
    durationSeconds: 2.5,
    fps: 16,
    loop: true,
    outputFormat: 'webm',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 3_600,
    runtimeTier: 'quick',
    runtimeHint: 'Short square clip intended for startup/loading animations.',
  },
  {
    id: 'wan-startup-webp',
    engine: 'wan',
    label: 'Startup WebP',
    description: '768×768, 2.5 seconds, 16 FPS, looping animated WebP.',
    width: 768,
    height: 768,
    durationSeconds: 2.5,
    fps: 16,
    loop: true,
    outputFormat: 'webp',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 5_400,
    runtimeTier: 'balanced',
    runtimeHint: 'Conservative WAN startup preset for the local studio card.',
  },
  {
    id: 'wan-startup-webm',
    engine: 'wan',
    label: 'Startup WebM',
    description: '768×768, 2.5 seconds, 16 FPS, looping WebM video.',
    width: 768,
    height: 768,
    durationSeconds: 2.5,
    fps: 16,
    loop: true,
    outputFormat: 'webm',
    renderScale: 1,
    latentUpscaleModel: null,
    refineSampler: null,
    refineSigmas: null,
    timeoutSeconds: 5_400,
    runtimeTier: 'balanced',
    runtimeHint: 'Conservative WAN startup preset for the local studio card.',
  },
] as const satisfies readonly VideoPresetDefinition[]

export type VideoPresetId = (typeof VIDEO_PRESETS)[number]['id']

export const DEFAULT_VIDEO_PRESET_BY_ENGINE: Record<VideoEngine, VideoPresetId> = {
  ltx: 'ltx-12gb-balanced',
  wan: 'wan-startup-webp',
}

export function getVideoPreset(
  presetId: string | null | undefined,
): (typeof VIDEO_PRESETS)[number] | null {
  if (!presetId) return null
  return VIDEO_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getDefaultVideoPreset(
  engine: VideoEngine,
): (typeof VIDEO_PRESETS)[number] {
  return getVideoPreset(DEFAULT_VIDEO_PRESET_BY_ENGINE[engine])!
}

export function getVideoPresetsForEngine(
  engine: VideoEngine,
): readonly (typeof VIDEO_PRESETS)[number][] {
  return VIDEO_PRESETS.filter((preset) => preset.engine === engine)
}

export function videoFrameCount(durationSeconds: number, fps: number): number {
  return Math.max(2, Math.round(durationSeconds * fps) + 1)
}

export function estimateVideoRuntimeTier(
  input: VideoWorkloadInput,
): VideoRuntimeTier {
  const width = Math.max(64, input.width || 0)
  const height = Math.max(64, input.height || 0)
  const frames = videoFrameCount(input.durationSeconds || 0, input.fps || 0)
  const scale = Math.min(1, Math.max(0.25, input.renderScale ?? 1))

  const finalPixelFrames = width * height * frames
  const firstPassEquivalent = finalPixelFrames * scale * scale
  const refinementEquivalent =
    input.engine === 'ltx' && input.latentUpscaleModel && scale < 1
      ? finalPixelFrames * 0.35
      : 0
  const equivalentWork = firstPassEquivalent + refinementEquivalent
  const balancedBaseline = 1280 * 720 * 65 * (0.25 + 0.35)
  const ratio = equivalentWork / balancedBaseline

  if (ratio <= 0.7) return 'quick'
  if (ratio <= 1.5) return 'balanced'
  if (ratio <= 3) return 'slow'
  return 'very-slow'
}

export function runtimeTierMessage(tier: VideoRuntimeTier): string {
  if (tier === 'quick') {
    return 'This should be a relatively quick studio render.'
  }
  if (tier === 'balanced') {
    return 'This is tuned for the 12 GB studio card and may still take a while.'
  }
  if (tier === 'slow') {
    return 'This is a heavy render for the 12 GB studio card. Expect a long generation.'
  }
  return 'This configuration is intentionally expensive on 12 GB VRAM and can take multiple hours.'
}
