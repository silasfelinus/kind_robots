// /utils/musicVideoMotion.ts
//
// Per-scene motion for the music video creator (music-video/t-009). Pure and
// DB-free.
//
// Default motion is Ken Burns over the scene still, done by the compositor
// (the browser exporter, t-014) and by Conductor's headless ffmpeg pipeline
// (scripts/build_music_video.py, t-021). The preset names below are the
// contract between them: keep that script's KEN_BURNS_PRESETS identical.
//
// A scene can opt in to a generated clip instead: an ltx or wan image-to-video
// job with the scene still as its first frame. Clips are silent; the song is
// the only audio. The finished clip is an ArtImage referenced by
// scene.motion.clipArtImageId.
import type { MusicVideoDoc, MusicVideoScene } from './musicVideoDoc'
import { composeScenePrompt } from './musicVideoScenes'
import {
  DEFAULT_VIDEO_PRESET_BY_ENGINE,
  getVideoPreset,
  runtimeTierMessage,
  type VideoEngine,
  type VideoPresetDefinition,
} from './videoPresets'

export const MUSIC_VIDEO_KEN_BURNS_PRESETS = [
  'zoom-in',
  'pan-right',
  'zoom-out',
  'pan-left',
] as const
export type MusicVideoKenBurnsPreset =
  (typeof MUSIC_VIDEO_KEN_BURNS_PRESETS)[number]

/** The clip engine and preset a scene gets unless the caller picks one. */
export const MUSIC_VIDEO_CLIP_ENGINE: VideoEngine = 'ltx'

export function isKenBurnsPreset(
  value: unknown,
): value is MusicVideoKenBurnsPreset {
  return (
    typeof value === 'string' &&
    (MUSIC_VIDEO_KEN_BURNS_PRESETS as readonly string[]).includes(value)
  )
}

/** Presets cycle by scene position, so neighbouring scenes never move alike. */
export function defaultKenBurnsPreset(index: number): MusicVideoKenBurnsPreset {
  const count = MUSIC_VIDEO_KEN_BURNS_PRESETS.length
  const slot = ((Math.trunc(index) % count) + count) % count
  return MUSIC_VIDEO_KEN_BURNS_PRESETS[slot] as MusicVideoKenBurnsPreset
}

/** The Ken Burns preset a scene renders with: its own, else its position's. */
export function sceneKenBurnsPreset(
  scene: Pick<MusicVideoScene, 'motion'>,
  index: number,
): MusicVideoKenBurnsPreset {
  return isKenBurnsPreset(scene.motion.preset)
    ? scene.motion.preset
    : defaultKenBurnsPreset(index)
}

/** Fill in a preset for every Ken Burns scene that has none. */
export function withDefaultKenBurnsPresets(
  scenes: MusicVideoScene[],
): MusicVideoScene[] {
  return scenes.map((scene, index) =>
    scene.motion.kind === 'kenburns' && !isKenBurnsPreset(scene.motion.preset)
      ? {
          ...scene,
          motion: { ...scene.motion, preset: defaultKenBurnsPreset(index) },
        }
      : scene,
  )
}

/** Resolve the video preset for a clip, refusing anything not ltx or wan. */
export function resolveClipPreset(
  presetId?: string | null,
): VideoPresetDefinition {
  const preset = presetId
    ? getVideoPreset(presetId)
    : getVideoPreset(DEFAULT_VIDEO_PRESET_BY_ENGINE[MUSIC_VIDEO_CLIP_ENGINE])
  if (!preset) throw new Error(`Unknown video preset "${presetId}".`)
  return preset as VideoPresetDefinition
}

/** What the clip will cost in wall-clock, for the UI and the API response. */
export function clipRuntimeHint(preset: VideoPresetDefinition): string {
  return `${preset.label}: ${preset.durationSeconds} s at ${preset.fps} fps. ${runtimeTierMessage(preset.runtimeTier)} ${preset.runtimeHint}`.trim()
}

export type SceneClipRequest = {
  engine: VideoEngine
  presetId: string
  promptString: string
  negativePrompt: string
  firstImageBase64: string
  width: number
  height: number
  durationSeconds: number
  fps: number
  loop: boolean
  outputFormat: 'mp4'
  renderScale: number
  latentUpscaleModel: string | null
  refineSampler: string | null
  refineSigmas: string | null
  timeoutSeconds: number
  isPublic: false
  isMature: false
  designer: string
  projectSlug: string
}

/**
 * The /api/video/generate body for one scene's clip. Throws with a reason a
 * caller can show when the scene cannot have one yet.
 */
export function buildSceneClipRequest(
  scene: MusicVideoScene,
  doc: MusicVideoDoc,
  options: {
    firstImageBase64: string
    projectSlug: string
    presetId?: string | null
  },
): SceneClipRequest {
  if (!scene.image.artImageId) {
    throw new Error(
      'The scene needs a finished still first; it is the clip’s first frame.',
    )
  }
  // Checked before composing: the style bible alone would pass as a prompt and
  // animate the house look with no subject in it.
  if (!scene.prompt.trim()) {
    throw new Error('The scene has no prompt to animate.')
  }
  const prompt = composeScenePrompt(scene.prompt, doc.settings.styleBible)
  const firstImageBase64 = options.firstImageBase64.trim()
  if (!firstImageBase64) throw new Error('The scene still has no image data.')
  const preset = resolveClipPreset(options.presetId)
  return {
    engine: preset.engine,
    presetId: preset.id,
    promptString: prompt,
    negativePrompt: '',
    firstImageBase64,
    width: preset.width,
    height: preset.height,
    durationSeconds: preset.durationSeconds,
    fps: preset.fps,
    // A scene clip plays once and is held on its last frame by the compositor.
    loop: false,
    // mp4, not the presets' default animated webp: the headless pipeline reads
    // clips with ffmpeg, whose animated-webp decoding is unreliable.
    outputFormat: 'mp4',
    renderScale: preset.renderScale,
    latentUpscaleModel: preset.latentUpscaleModel,
    refineSampler: preset.refineSampler,
    refineSigmas: preset.refineSigmas,
    timeoutSeconds: preset.timeoutSeconds,
    isPublic: false,
    isMature: false,
    designer: 'Music Video',
    projectSlug: options.projectSlug,
  }
}
