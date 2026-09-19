// /server/utils/artArchiveMetadata.ts
//
// Best-effort extraction of AI-generation metadata from a legacy art file
// (art-archive/t-004). PNG is where Automatic1111 ("parameters" tEXt chunk)
// and ComfyUI ("prompt"/"workflow" tEXt chunks, JSON) embed full generation
// metadata, so that gets full structured parsing. JPEG and WebP can also
// carry provenance -- EXIF UserComment/ImageDescription, XMP, and (for JPEG)
// COM segments -- reviewed in kind_robots#2816: an earlier version of this
// file returned `supported: false` for every JPEG/WebP unconditionally,
// which would have silently discarded exactly that evidence. `supported:
// false` is now reserved for files where none of these were actually found,
// not asserted for the whole format.
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
  | JpegWebpMetadata
  | {
      format: 'jpeg' | 'webp' | 'unknown'
      supported: false
    }

export type PngArchiveMetadata = Extract<ExtractedArchiveMetadata, { format: 'png' }>

/**
 * Narrows ExtractedArchiveMetadata to its PNG branch (the only one carrying
 * structured a1111/comfy fields), or null otherwise. Every call site that
 * reads `.a1111`/`.comfy` must go through this instead of re-deriving the
 * `!metadata.supported || metadata.format !== 'png'` guard by hand --
 * kind_robots#2824 hit a real TypeScript compile error from doing that
 * inline (art-archive/t-026).
 */
export function narrowToPngMetadata(metadata: ExtractedArchiveMetadata): PngArchiveMetadata | null {
  if (!metadata.supported || metadata.format !== 'png') return null
  return metadata
}

export type JpegWebpMetadata = {
  format: 'jpeg' | 'webp'
  supported: true
  /** EXIF UserComment (tag 0x9286), decoded per its ASCII/UNICODE/undefined character-code header. */
  exifUserComment: string | null
  /** EXIF ImageDescription (tag 0x010E), ASCII. */
  exifImageDescription: string | null
  /** Raw XMP packet text (APP1 for JPEG, the 'XMP ' RIFF chunk for WebP), unparsed. */
  xmp: string | null
  /** JPEG COM (0xFFFE) segment text, in file order. Always empty for WebP. */
  comments: string[]
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

// ---- JPEG segment / WebP chunk readers -------------------------------

const APP1_EXIF_PREFIX = 'Exif\0\0'
const APP1_XMP_PREFIX = 'http://ns.adobe.com/xap/1.0/\0'

/**
 * Walks JPEG markers up to Start-of-Scan (image data), collecting COM
 * comments and the first APP1 Exif/XMP payload of each kind found.
 */
function readJpegSegments(buffer: Buffer): {
  comments: string[]
  exifBuffer: Buffer | null
  xmp: string | null
} {
  const comments: string[] = []
  let exifBuffer: Buffer | null = null
  let xmp: string | null = null
  let offset = 2 // past SOI (FFD8)

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]!
    // Markers with no payload: SOI, standalone markers 0x01, RST0-RST7.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2
      continue
    }
    if (marker === 0xda) break // Start of Scan: entropy-coded data follows

    const length = buffer.readUInt16BE(offset + 2)
    const segmentStart = offset + 4
    const segmentEnd = segmentStart + length - 2
    if (length < 2 || segmentEnd > buffer.length) break
    const data = buffer.subarray(segmentStart, segmentEnd)

    if (marker === 0xfe) {
      comments.push(data.toString('latin1'))
    } else if (marker === 0xe1) {
      if (!exifBuffer && data.subarray(0, 6).toString('latin1') === APP1_EXIF_PREFIX) {
        exifBuffer = data.subarray(6)
      } else if (!xmp && data.subarray(0, APP1_XMP_PREFIX.length).toString('latin1') === APP1_XMP_PREFIX) {
        xmp = data.subarray(APP1_XMP_PREFIX.length).toString('utf8')
      }
    }

    offset = segmentEnd
  }

  return { comments, exifBuffer, xmp }
}

/** Walks WebP's RIFF chunk list for the 'EXIF' and 'XMP ' chunks. */
function readWebpChunks(buffer: Buffer): { exifBuffer: Buffer | null; xmp: string | null } {
  let exifBuffer: Buffer | null = null
  let xmp: string | null = null
  let offset = 12 // past "RIFF"<size>"WEBP"

  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.subarray(offset, offset + 4).toString('ascii')
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkSize
    if (dataEnd > buffer.length) break

    if (fourCC === 'EXIF') exifBuffer = buffer.subarray(dataStart, dataEnd)
    else if (fourCC === 'XMP ') xmp = buffer.subarray(dataStart, dataEnd).toString('utf8')

    offset = dataEnd + (chunkSize % 2) // RIFF chunks pad to an even size
  }

  return { exifBuffer, xmp }
}

// ---- Minimal TIFF/EXIF reader -----------------------------------------
//
// Just enough of the EXIF spec to reach UserComment (0x9286, via the Exif
// sub-IFD pointed to by IFD0 tag 0x8769) and ImageDescription (0x010E,
// directly in IFD0) -- the two tags generation tools actually use to carry
// free text. Not a general-purpose EXIF library: MakerNote and every other
// tag are ignored on purpose.

const TAG_IMAGE_DESCRIPTION = 0x010e
const TAG_EXIF_IFD_POINTER = 0x8769
const TAG_USER_COMMENT = 0x9286

type IfdEntry = { type: number; count: number; valueOffset: number; raw: Buffer }

function typeSize(type: number): number {
  switch (type) {
    case 1: // BYTE
    case 2: // ASCII
    case 6: // SBYTE
    case 7: // UNDEFINED
      return 1
    case 3: // SHORT
    case 8: // SSHORT
      return 2
    default:
      return 4 // LONG/SLONG/RATIONAL and anything else this doesn't special-case
  }
}

function readIfdEntries(buf: Buffer, ifdOffset: number, little: boolean): Map<number, IfdEntry> {
  const entries = new Map<number, IfdEntry>()
  if (ifdOffset < 0 || ifdOffset + 2 > buf.length) return entries
  const readU16 = (o: number) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const readU32 = (o: number) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o))

  const count = readU16(ifdOffset)
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > buf.length) break
    const raw = buf.subarray(entryOffset + 8, entryOffset + 12)
    entries.set(readU16(entryOffset), {
      type: readU16(entryOffset + 2),
      count: readU32(entryOffset + 4),
      valueOffset: readU32(entryOffset + 8),
      raw,
    })
  }
  return entries
}

function readFieldBytes(buf: Buffer, entry: IfdEntry): Buffer {
  const byteLength = typeSize(entry.type) * entry.count
  if (byteLength <= 4) return entry.raw.subarray(0, byteLength)
  if (entry.valueOffset + byteLength > buf.length) return Buffer.alloc(0)
  return buf.subarray(entry.valueOffset, entry.valueOffset + byteLength)
}

/** EXIF UserComment's first 8 bytes are a character-code header (EXIF 2.3 §4.6.4.2). */
function decodeExifUserComment(bytes: Buffer): string {
  if (bytes.length >= 8) {
    const code = bytes.subarray(0, 8).toString('ascii').replace(/\0+$/, '')
    const rest = bytes.subarray(8)
    if (code === 'UNICODE') return rest.toString('utf16le').replace(/\0+$/, '').trim()
    if (code === 'ASCII' || code === '') return rest.toString('latin1').replace(/\0+$/, '').trim()
  }
  return bytes.toString('latin1').replace(/\0+$/, '').trim()
}

/**
 * Parses a raw TIFF/EXIF buffer (a JPEG APP1 payload with the leading
 * "Exif\0\0" already stripped, or a WebP 'EXIF' chunk as-is -- WebP embeds
 * the TIFF structure directly, per the WebP spec's Exif profile section).
 */
export function parseExifTiff(buf: Buffer): {
  userComment: string | null
  imageDescription: string | null
} {
  const none = { userComment: null, imageDescription: null }
  if (buf.length < 8) return none
  const byteOrder = buf.subarray(0, 2).toString('ascii')
  if (byteOrder !== 'II' && byteOrder !== 'MM') return none
  const little = byteOrder === 'II'
  const readU32 = (o: number) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o))

  const ifd0 = readIfdEntries(buf, readU32(4), little)

  const descEntry = ifd0.get(TAG_IMAGE_DESCRIPTION)
  const imageDescription = descEntry
    ? readFieldBytes(buf, descEntry).toString('latin1').replace(/\0+$/, '').trim() || null
    : null

  let userComment: string | null = null
  const exifPointer = ifd0.get(TAG_EXIF_IFD_POINTER)
  if (exifPointer) {
    const subIfd = readIfdEntries(buf, exifPointer.valueOffset, little)
    const ucEntry = subIfd.get(TAG_USER_COMMENT)
    if (ucEntry) userComment = decodeExifUserComment(readFieldBytes(buf, ucEntry)) || null
  }

  return { userComment, imageDescription }
}

function extractJpegOrWebpMetadata(
  buffer: Buffer,
  format: 'jpeg' | 'webp',
): JpegWebpMetadata | { format: 'jpeg' | 'webp'; supported: false } {
  const { comments, exifBuffer, xmp } =
    format === 'jpeg'
      ? readJpegSegments(buffer)
      : { comments: [] as string[], ...readWebpChunks(buffer) }

  const exif = exifBuffer ? parseExifTiff(exifBuffer) : { userComment: null, imageDescription: null }
  const foundAnything =
    comments.length > 0 || xmp !== null || exif.userComment !== null || exif.imageDescription !== null

  if (!foundAnything) return { format, supported: false }

  return {
    format,
    supported: true,
    exifUserComment: exif.userComment,
    exifImageDescription: exif.imageDescription,
    xmp,
    comments,
  }
}

export function extractArchiveImageMetadata(
  buffer: Buffer,
  fileName: string,
): ExtractedArchiveMetadata {
  const format = detectFormat(buffer, fileName)

  if (format === 'png') {
    const rawTextChunks = readPngTextChunks(buffer)
    const a1111 = rawTextChunks.parameters ? parseA1111Parameters(rawTextChunks.parameters) : null
    const comfy = rawTextChunks.prompt ? parseComfyPromptGraph(rawTextChunks.prompt) : null
    return { format: 'png', supported: true, rawTextChunks, a1111, comfy }
  }

  if (format === 'jpeg' || format === 'webp') return extractJpegOrWebpMetadata(buffer, format)

  return { format: 'unknown', supported: false }
}

export function contentHashOf(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}
