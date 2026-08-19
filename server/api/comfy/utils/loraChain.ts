// /server/api/comfy/utils/loraChain.ts
//
// Chaining LoRAs into a Comfy graph.
//
// Every builder in this repo used to splice in exactly ONE LoRA node and route
// the sampler through it. That is not a ComfyUI limit -- LoRA loaders compose by
// feeding one's model (and CLIP) output into the next -- it was just what the
// single `loraName`/`loraStrength` pair could express. This module owns the
// chaining so the five builders that support LoRAs (sdxl txt2img, sdxl img2img,
// simple-checkpoint = krea2/flux2, kontext) stay identical in behavior instead
// of each growing its own loop.
//
// TWO CHAIN SHAPES, because the graphs differ:
//   - LoraLoader          takes model + clip, returns model + clip. Used where a
//                         CheckpointLoaderSimple supplies both (the SDXL lanes).
//   - LoraLoaderModelOnly takes model, returns model. Used where CLIP comes from
//                         a separate CLIPLoader/DualCLIPLoader and must not be
//                         re-routed (krea2, flux2, kontext).
//
// ORDER IS MEANINGFUL. LoRAs apply in sequence, so the caller's order is
// preserved exactly; later entries stack on top of earlier ones.

import { MAX_LORAS_PER_JOB } from '~/utils/loraLimits'

export type LoraChainNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type LoraChainWorkflow = Record<string, LoraChainNode>

export type LoraSelection = {
  name: string
  strength: number
}

/**
 * What a CALLER may hand a builder: the resolved shape above, a bare path
 * string, or the request shape the enqueue body carries (which names a Resource
 * by id and may leave `name` null until the resolver fills it in). Builders
 * accept this and run it through normalizeLoraSelections rather than making
 * every call site pre-normalize -- the old single-LoRA fields did the same, and
 * a builder that only accepted the strict shape would push that work onto four
 * separate route branches.
 */
export type LoraSelectionInput =
  | string
  | {
      name?: string | null
      loraName?: string | null
      lora_name?: string | null
      strength?: number | null
      loraStrength?: number | null
      strength_model?: number | null
      resourceId?: number | null
    }

// Re-exported rather than declared here so the picker and the queue cannot
// disagree about how many slots exist. See utils/loraLimits.ts for why the
// number lives there.
export { MAX_LORAS_PER_JOB }

const MIN_STRENGTH = -2
const MAX_STRENGTH = 2

type LoraInputRecord = {
  name?: unknown
  loraName?: unknown
  lora_name?: unknown
  strength?: unknown
  loraStrength?: unknown
  strength_model?: unknown
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function clampStrength(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(MAX_STRENGTH, Math.max(MIN_STRENGTH, parsed))
}

function readEntry(value: unknown): LoraSelection | null {
  if (typeof value === 'string') {
    const name = value.trim()
    return name ? { name, strength: 1 } : null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as LoraInputRecord
  const name =
    text(record.name) || text(record.loraName) || text(record.lora_name)
  if (!name) return null

  const rawStrength =
    record.strength ?? record.loraStrength ?? record.strength_model
  return {
    name,
    strength: rawStrength === undefined ? 1 : clampStrength(rawStrength),
  }
}

/**
 * The one place a request's LoRA fields become a list.
 *
 * Accepts the multi form (`loras`) and the legacy singular pair, so a caller
 * that predates chaining keeps working untouched. Names are deduped -- the same
 * LoRA twice is a mistake that would silently double its strength -- and the
 * first occurrence wins, preserving caller order.
 */
export function normalizeLoraSelections(input: {
  loras?: unknown
  loraName?: unknown
  loraStrength?: unknown
}): LoraSelection[] {
  const entries: LoraSelection[] = []

  if (Array.isArray(input.loras)) {
    for (const raw of input.loras) {
      const entry = readEntry(raw)
      if (entry) entries.push(entry)
    }
  }

  if (!entries.length) {
    const legacy = readEntry({
      name: input.loraName,
      strength: input.loraStrength,
    })
    if (legacy) entries.push(legacy)
  }

  const seen = new Set<string>()
  const deduped: LoraSelection[] = []
  for (const entry of entries) {
    const key = entry.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(entry)
  }

  return deduped.slice(0, MAX_LORAS_PER_JOB)
}

/** First free numeric node id at or after `startId`. */
function allocateId(workflow: LoraChainWorkflow, startId: number): string {
  let id = startId
  while (workflow[String(id)]) id += 1
  return String(id)
}

/**
 * The title `applyArtJobOverrides` reads to decide what it may repoint. It
 * deliberately skips anything titled "... Required ..." (LTX's distilled
 * acceleration LoRA), and `krLoraIndex` lets a single-LoRA override land on the
 * first link of a chain instead of collapsing every link onto one filename.
 */
function chainMeta(index: number, total: number): Record<string, unknown> {
  return {
    title: total > 1 ? `Style LoRA ${index + 1}` : 'Style LoRA',
    krLoraIndex: index,
  }
}

/**
 * Chain LoraLoaderModelOnly nodes off `model`, returning the model ref the
 * sampler (or scheduler/guider) should read. CLIP is untouched.
 */
export function appendModelOnlyLoraChain(
  workflow: LoraChainWorkflow,
  options: {
    loras: LoraSelection[]
    model: [string, number]
    startId: number
  },
): [string, number] {
  let model = options.model

  options.loras.forEach((lora, index) => {
    const id = allocateId(workflow, options.startId + index)
    workflow[id] = {
      inputs: {
        model,
        lora_name: lora.name,
        strength_model: lora.strength,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: chainMeta(index, options.loras.length),
    }
    model = [id, 0]
  })

  return model
}

/**
 * Chain LoraLoader nodes off `model` + `clip`, returning both refs. Text
 * encoders must read the chained CLIP or the LoRA's trigger tokens go
 * unrecognised -- an image that looks fine and ignores the style.
 */
export function appendModelClipLoraChain(
  workflow: LoraChainWorkflow,
  options: {
    loras: LoraSelection[]
    model: [string, number]
    clip: [string, number]
    startId: number
  },
): { model: [string, number]; clip: [string, number] } {
  let model = options.model
  let clip = options.clip

  options.loras.forEach((lora, index) => {
    const id = allocateId(workflow, options.startId + index)
    workflow[id] = {
      class_type: 'LoraLoader',
      inputs: {
        model,
        clip,
        lora_name: lora.name,
        strength_model: lora.strength,
        strength_clip: lora.strength,
      },
      _meta: chainMeta(index, options.loras.length),
    }
    model = [id, 0]
    clip = [id, 1]
  })

  return { model, clip }
}
