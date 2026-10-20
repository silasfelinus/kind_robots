export type RestyleSourceFormat = 'mp4' | 'mov' | 'webm' | 'mpg' | 'gif'
export type RestylePreviewKind = 'video' | 'image' | 'unplayable'

export const RESTYLE_SOURCE_FILE = /^source\.(mp4|mov|webm|mpg|gif)$/

export const RESTYLE_SOURCE_ACCEPT = [
  '.mp4',
  '.mov',
  '.webm',
  '.mpg',
  '.mpeg',
  '.mpe',
  '.gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/mpeg',
  'image/gif',
].join(',')

export const RESTYLE_SOURCE_EXTENSION = /\.(mp4|mov|webm|mpe?g|mpe|gif)$/i

const CONTENT_TYPES: Record<RestyleSourceFormat, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mpg: 'video/mpeg',
  gif: 'image/gif',
}

const MPEG_CLOCK = 90_000
const PTS_WRAP = 2 ** 33
const PTS_SAMPLE = 32
const GIF_MIN_DELAY_CS = 2
const GIF_DEFAULT_DELAY_CS = 10
const DURATION_PROBE_BYTES = 2 * 1024 * 1024

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end))
}

function byte(bytes: Uint8Array, i: number): number {
  return bytes[i] ?? 0
}

function isPackStart(bytes: Uint8Array, i: number): boolean {
  return (
    byte(bytes, i) === 0 &&
    byte(bytes, i + 1) === 0 &&
    byte(bytes, i + 2) === 1 &&
    byte(bytes, i + 3) === 0xba
  )
}

export function sniffRestyleSource(
  bytes: Uint8Array,
): RestyleSourceFormat | null {
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp') {
    return ascii(bytes, 8, 12).startsWith('qt') ? 'mov' : 'mp4'
  }
  if (
    bytes.length >= 4 &&
    byte(bytes, 0) === 0x1a &&
    byte(bytes, 1) === 0x45 &&
    byte(bytes, 2) === 0xdf &&
    byte(bytes, 3) === 0xa3
  )
    return 'webm'
  if (bytes.length >= 5 && isPackStart(bytes, 0)) return 'mpg'
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(ascii(bytes, 0, 6))) return 'gif'
  return null
}

export function restyleSourceContentType(sourceFile: string): string {
  const format = RESTYLE_SOURCE_FILE.exec(sourceFile)?.[1] as
    RestyleSourceFormat | undefined
  return format ? CONTENT_TYPES[format] : 'application/octet-stream'
}

export function restylePreviewKind(
  format: RestyleSourceFormat | null,
): RestylePreviewKind {
  if (format === 'gif') return 'image'
  if (format === 'mpg') return 'unplayable'
  return 'video'
}

export function restylePreviewKindForType(type: string): RestylePreviewKind {
  if (type === 'image/gif') return 'image'
  if (type === 'video/mpeg') return 'unplayable'
  return 'video'
}

function readTimestamp(b: Uint8Array, i: number): number | null {
  if (i + 5 > b.length) return null
  if (
    (byte(b, i) & 0x01) !== 1 ||
    (byte(b, i + 2) & 0x01) !== 1 ||
    (byte(b, i + 4) & 0x01) !== 1
  )
    return null
  const low =
    (byte(b, i + 1) << 22) |
    ((byte(b, i + 2) >> 1) << 15) |
    (byte(b, i + 3) << 7)
  return ((byte(b, i) >> 1) & 0x07) * 2 ** 30 + low + (byte(b, i + 4) >> 1)
}

function isMediaStream(id: number): boolean {
  return id === 0xbd || (id >= 0xc0 && id <= 0xef)
}

function readPts(b: Uint8Array, i: number): number | null {
  if (byte(b, i) !== 0 || byte(b, i + 1) !== 0 || byte(b, i + 2) !== 1)
    return null
  if (!isMediaStream(byte(b, i + 3))) return null
  let j = i + 6
  if ((byte(b, j) & 0xc0) === 0x80) {
    return byte(b, j + 1) & 0x80 &&
      (byte(b, j + 3) & 0xf0) >> 4 === byte(b, j + 1) >> 6
      ? readTimestamp(b, j + 3)
      : null
  }
  while (byte(b, j) === 0xff && j < i + 22) j++
  if ((byte(b, j) & 0xc0) === 0x40) j += 2
  return (byte(b, j) & 0xe0) === 0x20 ? readTimestamp(b, j) : null
}

function ptsList(bytes: Uint8Array): number[] {
  const found: number[] = []
  for (let i = 0; i + 14 <= bytes.length; i++) {
    const pts = readPts(bytes, i)
    if (pts !== null) found.push(pts)
  }
  return found
}

export function mpegDurationSec(head: Uint8Array, tail: Uint8Array): number {
  const first = ptsList(head).slice(0, PTS_SAMPLE)
  const last = ptsList(tail).slice(-PTS_SAMPLE)
  if (!first.length || !last.length) return 0
  const elapsed = Math.max(...last) - Math.min(...first)
  return (((elapsed % PTS_WRAP) + PTS_WRAP) % PTS_WRAP) / MPEG_CLOCK
}

function skipSubBlocks(bytes: Uint8Array, i: number): number {
  while (i < bytes.length) {
    const size = byte(bytes, i)
    i += 1 + size
    if (size === 0) break
  }
  return i
}

function colorTableBytes(packed: number): number {
  return packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0
}

export function gifDurationSec(bytes: Uint8Array): number {
  if (sniffRestyleSource(bytes) !== 'gif' || bytes.length < 13) return 0
  let i = 13 + colorTableBytes(byte(bytes, 10))
  let delay: number | null = null
  let centiseconds = 0
  while (i < bytes.length) {
    const block = byte(bytes, i)
    if (block === 0x21) {
      if (byte(bytes, i + 1) === 0xf9 && byte(bytes, i + 2) === 4)
        delay = byte(bytes, i + 4) | (byte(bytes, i + 5) << 8)
      i = skipSubBlocks(bytes, i + 2)
    } else if (block === 0x2c) {
      i = skipSubBlocks(bytes, i + 11 + colorTableBytes(byte(bytes, i + 9)))
      centiseconds +=
        delay === null || delay < GIF_MIN_DELAY_CS
          ? GIF_DEFAULT_DELAY_CS
          : delay
      delay = null
    } else break
  }
  return centiseconds / 100
}

async function readBytes(file: Blob, start: number, end: number) {
  return new Uint8Array(await file.slice(start, end).arrayBuffer())
}

export async function readRestyleSourceFormat(
  file: Blob,
): Promise<RestyleSourceFormat | null> {
  return sniffRestyleSource(await readBytes(file, 0, 16))
}

export async function readRestyleSourceDuration(
  file: Blob,
  format: RestyleSourceFormat,
): Promise<number> {
  if (format === 'gif')
    return gifDurationSec(await readBytes(file, 0, file.size))
  if (format !== 'mpg') return 0
  const head = await readBytes(file, 0, DURATION_PROBE_BYTES)
  const tail =
    file.size > DURATION_PROBE_BYTES
      ? await readBytes(file, file.size - DURATION_PROBE_BYTES, file.size)
      : head
  return mpegDurationSec(head, tail)
}
