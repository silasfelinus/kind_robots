// /stores/helpers/coloringExport.ts
//
// Export-to-image for coloring pages, per coloring-engine-spec.md section
// 2.5. The SVG markup builder is pure (Node-testable); only the blob
// rasterization touches the DOM.

import { BLANK_COLOR_VALUE } from '@/stores/helpers/coloring'
import type { ColoringPageDefinition } from '@/stores/helpers/coloring'

function escapeAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Builds standalone SVG markup for an svg-regions page: white paper,
 * optional underlay image, filled region paths, decor strokes, optional
 * lineArt image on top. Image hrefs should already be data URIs when the
 * output must rasterize offline (see inlineImageAsDataUri).
 */
export function buildColoringSvgMarkup(
  def: ColoringPageDefinition,
  fills: Record<string, string>,
  resolveColor: (colorId: string) => string,
  options: { strokeWidth?: number; imageHrefs?: Record<string, string> } = {},
): string {
  const { width, height } = def.viewBox
  const strokeWidth = options.strokeWidth ?? 3
  const hrefs = options.imageHrefs ?? {}

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
  ]

  const underlay = hrefs.underlay ?? def.layers.underlay
  if (underlay) {
    parts.push(
      `<image href="${escapeAttr(underlay)}" x="0" y="0" width="${width}" height="${height}"/>`,
    )
  }

  for (const region of def.regions ?? []) {
    const colorId = fills[region.id]
    const fill = colorId ? resolveColor(colorId) : BLANK_COLOR_VALUE

    parts.push(
      `<path d="${escapeAttr(region.d)}" fill="${escapeAttr(fill)}" stroke="#171312" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`,
    )
  }

  if (def.layers.decor) {
    parts.push(
      `<path d="${escapeAttr(def.layers.decor)}" fill="none" stroke="#171312" stroke-width="4" stroke-linecap="round"/>`,
    )
  }

  const lineArt = hrefs.lineArt ?? def.layers.lineArt
  if (lineArt) {
    parts.push(
      `<image href="${escapeAttr(lineArt)}" x="0" y="0" width="${width}" height="${height}"/>`,
    )
  }

  parts.push('</svg>')
  return parts.join('')
}

/** Fetches an asset and returns it as a data URI (for offline-safe SVG rasterization). */
export async function inlineImageAsDataUri(src: string): Promise<string> {
  const response = await fetch(src)
  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Could not inline ${src}`))
    reader.readAsDataURL(blob)
  })
}

/**
 * Rasterizes an svg-regions page to a PNG blob at export scale.
 * Shareable-quality only — print masters come from the generation pipeline.
 */
export async function exportSvgPageToBlob(
  def: ColoringPageDefinition,
  fills: Record<string, string>,
  resolveColor: (colorId: string) => string,
  options: { scale?: number; strokeWidth?: number } = {},
): Promise<Blob> {
  const scale = options.scale ?? 2

  const imageHrefs: Record<string, string> = {}
  if (def.layers.underlay) {
    imageHrefs.underlay = await inlineImageAsDataUri(def.layers.underlay)
  }
  if (def.layers.lineArt) {
    imageHrefs.lineArt = await inlineImageAsDataUri(def.layers.lineArt)
  }

  const markup = buildColoringSvgMarkup(def, fills, resolveColor, {
    strokeWidth: options.strokeWidth,
    imageHrefs,
  })

  const svgBlob = new Blob([markup], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not render page SVG'))
      el.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = def.viewBox.width * scale
    canvas.height = def.viewBox.height * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Rasterizes a raster-flood page: the working canvas already is the image;
 * composite the optional lineArt layer above and export.
 */
export async function exportRasterCanvasToBlob(
  workingCanvas: HTMLCanvasElement,
  lineArtSrc?: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = workingCanvas.width
  canvas.height = workingCanvas.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.drawImage(workingCanvas, 0, 0)

  if (lineArtSrc) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not load line art'))
      el.src = lineArtSrc
    })

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      'image/png',
    )
  })
}

/** Triggers a browser download for an exported page blob. */
export function downloadPageBlob(blob: Blob, pageId: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${pageId.replace('/', '-')}.png`
  link.click()
  URL.revokeObjectURL(url)
}
