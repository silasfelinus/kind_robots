export type VideoEngine = 'ltx' | 'wan'
export type VideoOutputFormat = 'webp' | 'mp4' | 'webm'

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
}

export const VIDEO_PRESETS = [
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
  },
] as const satisfies readonly VideoPresetDefinition[]

export type VideoPresetId = (typeof VIDEO_PRESETS)[number]['id']

export function getVideoPreset(
  presetId: string | null | undefined,
): (typeof VIDEO_PRESETS)[number] | null {
  if (!presetId) return null
  return VIDEO_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getVideoPresetsForEngine(
  engine: VideoEngine,
): readonly (typeof VIDEO_PRESETS)[number][] {
  return VIDEO_PRESETS.filter((preset) => preset.engine === engine)
}
