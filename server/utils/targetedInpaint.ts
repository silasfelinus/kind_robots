import { createHash } from 'node:crypto'
import sharp from 'sharp'

export type EditTarget =
  | {
      type: 'box'
      box: [number, number, number, number]
      bleedPx?: number
      featherPx?: number
    }
  | {
      type: 'polygon'
      points: Array<[number, number]>
      bleedPx?: number
      featherPx?: number
    }

export type TargetedEditRequest = {
  imageData: string
  targets: EditTarget[]
  mode?: 'full-frame' | 'crop'
  contextPx?: number
  bleedPx?: number
  featherPx?: number
}

type PixelBounds = { x: number; y: number; width: number; height: number }

export type PreparedTargetedEdit = {
  originalData: string
  sampleData: string
  noiseMaskData: string
  compositeMaskData: string
  sourceHash: string
  originalWidth: number
  originalHeight: number
  sampleWidth: number
  sampleHeight: number
  crop: PixelBounds
  mode: 'full-frame' | 'crop'
  targets: EditTarget[]
}

const MAX_PIXELS = 4_194_304
const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_TARGETS = 12
const IMAGE_DATA_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/

function finiteRange(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(name + ' must be between ' + min + ' and ' + max + '.')
  }
  return value
}

function targetPoints(target: EditTarget): Array<[number, number]> {
  if (target.type === 'box') {
    if (!Array.isArray(target.box) || target.box.length !== 4) {
      throw new Error('Each box target requires four normalized coordinates.')
    }
    const [x1, y1, x2, y2] = target.box.map((value) =>
      finiteRange(value, 0, 1, 'box coordinate'),
    )
    if (x2 <= x1 || y2 <= y1) {
      throw new Error('Box targets must have positive width and height.')
    }
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
  }
  if (target.type !== 'polygon' || !Array.isArray(target.points) ||
      target.points.length < 3 || target.points.length > 24) {
    throw new Error('Polygon targets require between 3 and 24 points.')
  }
  const points = target.points.map((point) => {
    if (!Array.isArray(point) || point.length !== 2) {
      throw new Error('Polygon points must be [x, y] coordinates.')
    }
    return [
      finiteRange(point[0], 0, 1, 'polygon x'),
      finiteRange(point[1], 0, 1, 'polygon y'),
    ] as [number, number]
  })
  const twiceArea = points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length]!
    return sum + x * nextY - nextX * y
  }, 0)
  if (Math.abs(twiceArea) < 0.00001) {
    throw new Error('A polygon target must enclose an area.')
  }
  return points
}

function svgForTarget(
  points: Array<[number, number]>,
  width: number,
  height: number,
  bleedPx: number,
): Buffer {
  const path = points
    .map(([x, y]) => (x * width).toFixed(3) + ',' + (y * height).toFixed(3))
    .join(' ')
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
      '" height="' + height + '">' +
      '<rect width="100%" height="100%" fill="black"/>' +
      '<polygon points="' + path + '" fill="white" stroke="white" ' +
      'stroke-width="' + (bleedPx * 2) + '" stroke-linejoin="round"/>' +
      '</svg>',
  )
}

async function cropAndPad(
  buffer: Buffer,
  width: number,
  height: number,
  crop: PixelBounds,
  paddingRight: number,
  paddingBottom: number,
): Promise<Buffer> {
  return sharp(buffer, { raw: { width, height, channels: 1 } })
    .extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
    .extend({
      right: paddingRight,
      bottom: paddingBottom,
      background: '#000000',
    })
    .png()
    .toBuffer()
}

function toDataUrl(buffer: Buffer): string {
  return 'data:image/png;base64,' + buffer.toString('base64')
}

export async function prepareTargetedEdit(
  request: TargetedEditRequest,
): Promise<PreparedTargetedEdit> {
  const data = request.imageData
  if (typeof data !== 'string' || data.length > MAX_SOURCE_BYTES * 1.4) {
    throw new Error('A source image data URL is required (max 10 MiB decoded).')
  }
  const match = IMAGE_DATA_PATTERN.exec(data)
  if (!match) {
    throw new Error('Expected a PNG, JPEG or WebP base64 image data URL.')
  }
  const decoded = Buffer.from(match[2]!, 'base64')
  if (!decoded.length || decoded.length > MAX_SOURCE_BYTES) {
    throw new Error('Source image exceeds the 10 MiB limit.')
  }
  const source = await sharp(decoded, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .ensureAlpha()
    .png()
    .toBuffer()
  const metadata = await sharp(source).metadata()
  const width = metadata.width!
  const height = metadata.height!
  if (width < 64 || height < 64 || width * height > MAX_PIXELS) {
    throw new Error('Source dimensions must be at least 64 pixels and at most 4 MP.')
  }
  if (!Array.isArray(request.targets) || request.targets.length < 1 ||
      request.targets.length > MAX_TARGETS) {
    throw new Error('Supply between 1 and 12 edit targets.')
  }
  const mode = request.mode ?? 'full-frame'
  if (mode !== 'full-frame' && mode !== 'crop') {
    throw new Error('mode must be full-frame or crop.')
  }
  const bleed = finiteRange(request.bleedPx ?? 12, 0, 96, 'bleedPx')
  const feather = finiteRange(request.featherPx ?? 8, 0, 48, 'featherPx')
  const context = finiteRange(request.contextPx ?? 128, 0, 384, 'contextPx')

  const hard = Buffer.alloc(width * height)
  const soft = Buffer.alloc(width * height)
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (const target of request.targets) {
    const points = targetPoints(target)
    const padding = finiteRange(target.bleedPx ?? bleed, 0, 96, 'target bleedPx')
    const fade = finiteRange(target.featherPx ?? feather, 0, 48, 'target featherPx')
    for (const [x, y] of points) {
      minX = Math.min(minX, x * width - padding)
      minY = Math.min(minY, y * height - padding)
      maxX = Math.max(maxX, x * width + padding)
      maxY = Math.max(maxY, y * height + padding)
    }
    const rendered = await sharp(svgForTarget(points, width, height, padding))
      .greyscale()
      .raw()
      .toBuffer()
    const blurred = fade > 0
      ? await sharp(rendered, { raw: { width, height, channels: 1 } })
          .blur(Math.max(fade, 0.3))
          .raw()
          .toBuffer()
      : rendered
    for (let i = 0; i < hard.length; i++) {
      const opaque = rendered[i]!
      hard[i] = Math.max(hard[i]!, opaque)
      soft[i] = Math.max(soft[i]!, Math.min(opaque, blurred[i]!))
    }
  }

  const minSide = 512
  const crop = mode === 'crop'
    ? (() => {
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const halfW = Math.max((maxX - minX) / 2 + context, minSide / 2)
        const halfH = Math.max((maxY - minY) / 2 + context, minSide / 2)
        const x = Math.max(0, Math.floor(centerX - halfW))
        const y = Math.max(0, Math.floor(centerY - halfH))
        const right = Math.min(width, Math.ceil(centerX + halfW))
        const bottom = Math.min(height, Math.ceil(centerY + halfH))
        return { x, y, width: right - x, height: bottom - y }
      })()
    : { x: 0, y: 0, width, height }
  if (crop.width <= 0 || crop.height <= 0) {
    throw new Error('Target edit crop has no area.')
  }

  const padX = (8 - (crop.width % 8)) % 8
  const padY = (8 - (crop.height % 8)) % 8
  const sample = await sharp(source)
    .extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
    .extend({
      right: padX,
      bottom: padY,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  const noiseMask = await cropAndPad(hard, width, height, crop, padX, padY)
  const compositeMask = await cropAndPad(soft, width, height, crop, padX, padY)

  return {
    originalData: toDataUrl(source),
    sampleData: toDataUrl(sample),
    noiseMaskData: toDataUrl(noiseMask),
    compositeMaskData: toDataUrl(compositeMask),
    sourceHash: createHash('sha256').update(source).digest('hex'),
    originalWidth: width,
    originalHeight: height,
    sampleWidth: crop.width + padX,
    sampleHeight: crop.height + padY,
    crop,
    mode,
    targets: request.targets,
  }
}
