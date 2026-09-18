// /server/utils/artArchiveMetadata.ts
//
// Best-effort extraction of AI-generation metadata from a legacy art file
// (art-archive/t-004). PNG is the format that actually carries this data in
// practice -- both Automatic1111 ("parameters" tEXt chunk) and ComfyUI
// ("prompt"/"workflow" tEXt chunks, JSON) embed it as uncompressed PNG text
// chunks -- so this is where the real parsing effort goes. Other formats
// (JPEG/WebP) are still hashed and indexed by the scanner, they simply carry
// no structured generation metadata here; `supported: false` says so rather
// than silently returning an empty object indistinguishable from "found
// nothing".
import { createHash } from 'node:crypto'

export type ExtractedArchiveMetadata =
  | {
      format: 'png'
      supported: true
      /** Raw PNG text chunks, keyword -> text, exactly as embedded. */
      rawTextChunks: Record<string, string>
      a1111: A1111Parameters | null
      comfy: ComfyPromptMetadata | null
    }
  | {
      format: 'jpeg' | 'webp' | 'unknown'
      supported: false
    }

export type A1111Parameters = {
  prompt: string
  negativePrompt: string
  steps: number | null
  sampler: string | null
  cfg: number | null
  seed: number | null
  checkpoint: string | null
  checkpointHash: string | null
  size: string | null
  loraTokens: Array<{ name: string; weight: number }>
  raw: string
}

export type ComfyPromptMetadata = {
  checkpoint: string | null
  loraTokens: Array<{ name: string; weight: number | null }>
  seed: number | null
  steps: number | null
  cfg: number | null
  sampler: string | null
  positivePrompt: string | null
  negativePrompt: string | null
  /** Any CLIPTextEncode text this couldn't confidently classify as +/-. */
  otherTexts: string[]
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function detectFormat(buffer: Buffer, fileName: string): 'png' | 'jpeg' | 'webp' | 'unknown' {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'jpeg'
  if (ext === '.webp') return 'webp'
  return 'unknown'
}

/**
 * Reads tEXt and uncompressed iTXt chunks from a PNG buffer. Compressed iTXt
 * (compression flag set) and zTXt are skipped -- A1111/ComfyUI both write
 * plain tEXt for the fields this cares about, so decompression would add
 * real complexity for no known real-world payload.
 */
function readPngTextChunks(buffer: Buffer): Record<string, string> {
  const chunks: Record<string, string> = {}
  let offset = PNG_SIGNATURE.length

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > buffer.length) break
    const data = buffer.subarray(dataStart, dataEnd)

    if (type === 'tEXt') {
      const nul = data.indexOf(0)
      if (nul > 0) {
        const keyword = data.subarray(0, nul).toString('latin1')
        const text = data.subarray(nul + 1).toString('latin1')
        chunks[keyword] = text
      }
    } else if (type === 'iTXt') {
      const firstNul = data.indexOf(0)
      if (firstNul > 0) {
        const keyword = data.subarray(0, firstNul).toString('latin1')
        const compressionFlag = data[firstNul + 1]
        if (compressionFlag === 0) {
          const secondNul = data.indexOf(0, firstNul + 3)
          const thirdNul = secondNul >= 0 ? data.indexOf(0, secondNul + 1) : -1
          if (thirdNul >= 0) {
            chunks[keyword] = data.subarray(thirdNul + 1).toString('utf8')
          }
        }
      }
    } else if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4 // skip CRC
  }

  return chunks
}

const LORA_TOKEN_RE = /<lora:([^:>]+):([-\d.]+)>/gi

function extractLoraTokens(text: string): Array<{ name: string; weight: number }> {
  const tokens: Array<{ name: string; weight: number }> = []
  for (const match of text.matchAll(LORA_TOKEN_RE)) {
    const weight = Number.parseFloat(match[2]!)
    tokens.push({ name: match[1]!.trim(), weight: Number.isFinite(weight) ? weight : 1 })
  }
  return tokens
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Parses an Automatic1111-style `parameters` string:
 *
 *   <prompt>
 *   Negative prompt: <negative prompt>
 *   Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 123, ...
 *
 * The settings line is located by its `Steps:` marker rather than by line
 * position, since the negative-prompt block can itself span multiple lines.
 */
export function parseA1111Parameters(raw: string): A1111Parameters {
  const negativeMarker = '\nNegative prompt:'
  const negativeIndex = raw.indexOf(negativeMarker)
  const beforeNegative = negativeIndex >= 0 ? raw.slice(0, negativeIndex) : raw
  const afterNegative = negativeIndex >= 0 ? raw.slice(negativeIndex + 1) : ''

  const stepsMarker = afterNegative.search(/(?:^|\n)Steps:\s*\d/)
  const searchBase = negativeIndex >= 0 ? afterNegative : raw
  const stepsIndexInBase =
    negativeIndex >= 0 ? stepsMarker : raw.search(/(?:^|\n)Steps:\s*\d/)

  const negativePrompt =
    negativeIndex >= 0
      ? (stepsIndexInBase >= 0
          ? afterNegative.slice('Negative prompt:'.length, stepsIndexInBase)
          : afterNegative.slice('Negative prompt:'.length)
        ).trim()
      : ''

  const settingsLine =
    stepsIndexInBase >= 0 ? searchBase.slice(stepsIndexInBase).trim() : ''

  const settings: Record<string, string> = {}
  const settingsRe = /([A-Za-z][A-Za-z ]*):\s*("[^"]*"|[^,]+)(?:,|$)/g
  for (const match of settingsLine.matchAll(settingsRe)) {
    const key = match[1]!.trim()
    let value = match[2]!.trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    settings[key] = value
  }

  const prompt = (stepsIndexInBase >= 0 && negativeIndex < 0
    ? beforeNegative.slice(0, raw.search(/(?:^|\n)Steps:\s*\d/))
    : beforeNegative
  ).trim()

  return {
    prompt,
    negativePrompt,
    steps: settings.Steps ? Number.parseInt(settings.Steps, 10) : null,
    sampler: settings.Sampler ?? null,
    cfg: toNumber(settings['CFG scale']),
    seed: settings.Seed ? Number.parseInt(settings.Seed, 10) : null,
    checkpoint: settings.Model ?? null,
    checkpointHash: settings['Model hash'] ?? null,
    size: settings.Size ?? null,
    loraTokens: [...extractLoraTokens(prompt), ...extractLoraTokens(negativePrompt)],
    raw,
  }
}

type ComfyNode = { class_type?: string; inputs?: Record<string, unknown> }
type ComfyLink = [string | number, number]

function isLink(value: unknown): value is ComfyLink {
  return Array.isArray(value) && value.length === 2
}

/**
 * Best-effort read of a ComfyUI API-format prompt graph (node id -> node).
 * Handles the common single-checkpoint/single-KSampler shape; anything it
 * can't confidently classify (which CLIPTextEncode is positive vs negative,
 * an unrecognized sampler node) is still surfaced, just not attributed.
 */
export function parseComfyPromptGraph(raw: string): ComfyPromptMetadata | null {
  let graph: Record<string, ComfyNode>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    graph = parsed as Record<string, ComfyNode>
  } catch {
    return null
  }

  let checkpoint: string | null = null
  const loraTokens: Array<{ name: string; weight: number | null }> = []
  let seed: number | null = null
  let steps: number | null = null
  let cfg: number | null = null
  let sampler: string | null = null
  let positiveLink: ComfyLink | null = null
  let negativeLink: ComfyLink | null = null

  for (const node of Object.values(graph)) {
    const classType = node.class_type ?? ''
    const inputs = node.inputs ?? {}

    if (/CheckpointLoader/i.test(classType) && typeof inputs.ckpt_name === 'string') {
      checkpoint = inputs.ckpt_name
    }
    if (/LoraLoader/i.test(classType) && typeof inputs.lora_name === 'string') {
      const weight =
        typeof inputs.strength_model === 'number' ? inputs.strength_model : null
      loraTokens.push({ name: inputs.lora_name, weight })
    }
    if (/KSampler/i.test(classType)) {
      const seedValue = inputs.seed ?? inputs.noise_seed
      if (typeof seedValue === 'number') seed = seedValue
      if (typeof inputs.steps === 'number') steps = inputs.steps
      if (typeof inputs.cfg === 'number') cfg = inputs.cfg
      if (typeof inputs.sampler_name === 'string') sampler = inputs.sampler_name
      if (isLink(inputs.positive)) positiveLink = inputs.positive
      if (isLink(inputs.negative)) negativeLink = inputs.negative
    }
  }

  const textById = (id: string | number | null): string | null => {
    if (id === null) return null
    const node = graph[String(id)]
    const text = node?.inputs?.text
    return typeof text === 'string' ? text : null
  }

  const positivePrompt = textById(positiveLink ? positiveLink[0] : null)
  const negativePrompt = textById(negativeLink ? negativeLink[0] : null)

  const otherTexts: string[] = []
  for (const [id, node] of Object.entries(graph)) {
    if (!/CLIPTextEncode/i.test(node.class_type ?? '')) continue
    if (id === String(positiveLink?.[0]) || id === String(negativeLink?.[0])) continue
    const text = node.inputs?.text
    if (typeof text === 'string' && text.trim()) otherTexts.push(text)
  }

  return {
    checkpoint,
    loraTokens,
    seed,
    steps,
    cfg,
    sampler,
    positivePrompt,
    negativePrompt,
    otherTexts,
  }
}

export function extractArchiveImageMetadata(
  buffer: Buffer,
  fileName: string,
): ExtractedArchiveMetadata {
  const format = detectFormat(buffer, fileName)
  if (format !== 'png') return { format, supported: false }

  const rawTextChunks = readPngTextChunks(buffer)
  const a1111 = rawTextChunks.parameters ? parseA1111Parameters(rawTextChunks.parameters) : null
  const comfy = rawTextChunks.prompt ? parseComfyPromptGraph(rawTextChunks.prompt) : null

  return { format: 'png', supported: true, rawTextChunks, a1111, comfy }
}

export function contentHashOf(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}
