// /server/api/comfy/acestep/utils/workflow.ts
//
// ACE-Step 1.5 turbo text-to-song graph (music-video/t-010). Pure and DB-free.
//
// Built from Conductor's projects/music-video/docs/ace-step-spike.md, which
// transcribes the official audio_ace_step_1_5_split template: UNETLoader ->
// ModelSamplingAuraFlow -> KSampler; DualCLIPLoader -> TextEncodeAceStepAudio1.5
// -> positive and, via ConditioningZeroOut, negative; EmptyAceStep1.5LatentAudio
// -> latent; VAEDecodeAudio -> SaveAudioAdvanced (mp3).
//
// Two pairs must agree, because the template drives each from one primitive:
// duration (encoder node 5 and latent node 7) and seed (encoder node 5 and
// KSampler node 8). The builder sets both from one value so they cannot drift.
//
// Nothing here has run on the render box yet; t-012 is the live proof and may
// replace the SaveAudioAdvanced encoding the spike marked UNVERIFIED.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type: string
  inputs: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type AceStepTimeSignature = '2' | '3' | '4' | '6'

export type AceStepSongInput = {
  /** Style prose: genre, mood, instruments, voice. Also the job's promptString. */
  tags: string
  /** Section-tagged lyrics, e.g. from toAceStepLyrics(). Empty for instrumental. */
  lyrics: string
  durationSeconds: number
  bpm?: number | null
  seed?: number | null
  keyscale?: string | null
  timeSignature?: string | null
  language?: string | null
  filenamePrefix?: string | null
}

export const ACESTEP_UNET = 'acestep_v1.5_turbo.safetensors'
export const ACESTEP_CLIP_SMALL = 'qwen_0.6b_ace15.safetensors'
export const ACESTEP_CLIP_LARGE = 'qwen_1.7b_ace15.safetensors'
export const ACESTEP_VAE = 'ace_1.5_vae.safetensors'
export const ACESTEP_STEPS = 8
export const ACESTEP_CFG = 1
export const ACESTEP_DEFAULT_BPM = 120
export const ACESTEP_DEFAULT_KEYSCALE = 'E minor'
export const ACESTEP_MIN_SECONDS = 10
export const ACESTEP_MAX_SECONDS = 600
export const ACESTEP_MIN_BPM = 10
export const ACESTEP_MAX_BPM = 300
export const ACESTEP_INSTRUMENTAL_LYRICS = '[Instrumental]'

const KEY_PATTERN = /^[A-G](?:#|b)? (?:major|minor)$/
const LANGUAGE_PATTERN = /^[a-z]{2}$/
const TIME_SIGNATURES: readonly AceStepTimeSignature[] = ['2', '3', '4', '6']

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 2_147_483_647)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeAceStepKeyscale(value?: string | null): string {
  const key = String(value || '').trim()
  return KEY_PATTERN.test(key) ? key : ACESTEP_DEFAULT_KEYSCALE
}

export function normalizeAceStepTimeSignature(
  value?: string | null,
): AceStepTimeSignature {
  const raw =
    String(value || '')
      .trim()
      .split('/')[0] ?? ''
  return (TIME_SIGNATURES as readonly string[]).includes(raw)
    ? (raw as AceStepTimeSignature)
    : '4'
}

export function buildAceStepSongWorkflow(
  input: AceStepSongInput,
): ComfyWorkflow {
  const tags = input.tags.replace(/\s+/g, ' ').trim()
  if (!tags) throw new Error('ACE-Step needs non-empty style tags.')
  if (!Number.isFinite(input.durationSeconds)) {
    throw new Error('ACE-Step needs a finite durationSeconds.')
  }
  const seconds = clamp(
    Math.round(input.durationSeconds),
    ACESTEP_MIN_SECONDS,
    ACESTEP_MAX_SECONDS,
  )
  const seed = resolveSeed(input.seed)
  const bpm = clamp(
    Math.round(
      typeof input.bpm === 'number' && Number.isFinite(input.bpm)
        ? input.bpm
        : ACESTEP_DEFAULT_BPM,
    ),
    ACESTEP_MIN_BPM,
    ACESTEP_MAX_BPM,
  )
  const lyrics = input.lyrics.trim() || ACESTEP_INSTRUMENTAL_LYRICS
  const language = String(input.language || '')
    .trim()
    .toLowerCase()

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: { unet_name: ACESTEP_UNET, weight_dtype: 'default' },
      _meta: { title: 'ACE-Step 1.5 turbo' },
    },
    '2': {
      class_type: 'DualCLIPLoader',
      inputs: {
        clip_name1: ACESTEP_CLIP_SMALL,
        clip_name2: ACESTEP_CLIP_LARGE,
        type: 'ace',
        device: 'default',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: { vae_name: ACESTEP_VAE },
    },
    '4': {
      class_type: 'ModelSamplingAuraFlow',
      inputs: { model: ['1', 0], shift: 3 },
    },
    '5': {
      class_type: 'TextEncodeAceStepAudio1.5',
      inputs: {
        clip: ['2', 0],
        tags,
        lyrics,
        seed,
        bpm,
        duration: seconds,
        timesignature: normalizeAceStepTimeSignature(input.timeSignature),
        language: LANGUAGE_PATTERN.test(language) ? language : 'en',
        keyscale: normalizeAceStepKeyscale(input.keyscale),
        generate_audio_codes: true,
        cfg_scale: 2.0,
        temperature: 0.85,
        top_p: 0.9,
        top_k: 0,
        min_p: 0.0,
      },
      _meta: { title: 'Song prompt' },
    },
    '6': {
      class_type: 'ConditioningZeroOut',
      inputs: { conditioning: ['5', 0] },
    },
    '7': {
      class_type: 'EmptyAceStep1.5LatentAudio',
      inputs: { seconds, batch_size: 1 },
    },
    '8': {
      class_type: 'KSampler',
      inputs: {
        model: ['4', 0],
        positive: ['5', 0],
        negative: ['6', 0],
        latent_image: ['7', 0],
        seed,
        steps: ACESTEP_STEPS,
        cfg: ACESTEP_CFG,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: 1,
      },
    },
    '9': {
      class_type: 'VAEDecodeAudio',
      inputs: { samples: ['8', 0], vae: ['3', 0] },
    },
    '10': {
      class_type: 'SaveAudioAdvanced',
      inputs: {
        audio: ['9', 0],
        filename_prefix: input.filenamePrefix?.trim() || 'audio/musicvideo',
        format: 'mp3',
        'format.quality': 'V0',
      },
    },
  }
}

/** Generous ceiling for the relay: cold model load plus generation. */
export function aceStepTimeoutSeconds(durationSeconds: number): number {
  return Math.max(300, Math.round(durationSeconds * 2) + 240)
}
