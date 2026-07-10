// /stores/helpers/floodFill.ts
//
// Pure scanline flood fill over an RGBA pixel buffer, per the raster-flood
// mode in conductor projects/coloring-book/docs/generation-pipeline.md and
// coloring-engine-spec.md section 3.2. Kept DOM-free so the algorithm is
// verifiable in Node without a browser canvas.

export interface FloodFillResult {
  /** Number of pixels changed; 0 means the click was rejected (line/no-op). */
  filled: number
}

function colorDistance(
  data: Uint8ClampedArray,
  index: number,
  r: number,
  g: number,
  b: number,
): number {
  return (
    Math.abs(data[index]! - r) +
    Math.abs(data[index + 1]! - g) +
    Math.abs(data[index + 2]! - b)
  )
}

/** Dark pixels are treated as line art and never filled or crossed. */
function isLinePixel(
  data: Uint8ClampedArray,
  index: number,
  lineLuma: number,
): boolean {
  const r = data[index]!
  const g = data[index + 1]!
  const b = data[index + 2]!
  return 0.299 * r + 0.587 * g + 0.114 * b < lineLuma
}

/**
 * Flood-fills the region around (startX, startY) with the given RGB color.
 * Mutates `data` in place. `tolerance` is the summed per-channel distance
 * from the clicked pixel's color that still counts as the same region
 * (generation-pipeline default: 24 per channel → pass ~72 summed, we keep
 * the knob explicit). Line-art pixels (luma < lineLuma) act as walls.
 */
export function floodFillRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fill: { r: number; g: number; b: number },
  options: { tolerance?: number; lineLuma?: number } = {},
): FloodFillResult {
  const tolerance = options.tolerance ?? 72
  const lineLuma = options.lineLuma ?? 96

  const x0 = Math.floor(startX)
  const y0 = Math.floor(startY)

  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return { filled: 0 }

  const startIndex = (y0 * width + x0) * 4

  if (isLinePixel(data, startIndex, lineLuma)) return { filled: 0 }

  const targetR = data[startIndex]!
  const targetG = data[startIndex + 1]!
  const targetB = data[startIndex + 2]!

  // No-op when the region is already exactly the fill color.
  if (targetR === fill.r && targetG === fill.g && targetB === fill.b) {
    return { filled: 0 }
  }

  const matches = (index: number): boolean => {
    if (isLinePixel(data, index, lineLuma)) return false
    return colorDistance(data, index, targetR, targetG, targetB) <= tolerance
  }

  const paint = (index: number) => {
    data[index] = fill.r
    data[index + 1] = fill.g
    data[index + 2] = fill.b
    data[index + 3] = 255
  }

  let filled = 0
  const visited = new Uint8Array(width * height)
  const stack: number[] = [y0 * width + x0]

  while (stack.length) {
    const pixel = stack.pop()!
    if (visited[pixel]) continue

    const y = Math.floor(pixel / width)
    let x = pixel % width

    // Walk left to the span start.
    while (
      x > 0 &&
      !visited[y * width + x - 1] &&
      matches((y * width + x - 1) * 4)
    ) {
      x--
    }

    let spanUp = false
    let spanDown = false

    // Fill rightward across the span, seeding rows above and below.
    while (x < width) {
      const spanPixel = y * width + x
      const spanIndex = spanPixel * 4

      if (visited[spanPixel] || !matches(spanIndex)) break

      paint(spanIndex)
      visited[spanPixel] = 1
      filled++

      if (y > 0) {
        const upPixel = (y - 1) * width + x
        const canUp = !visited[upPixel] && matches(upPixel * 4)
        if (canUp && !spanUp) {
          stack.push(upPixel)
          spanUp = true
        } else if (!canUp) {
          spanUp = false
        }
      }

      if (y < height - 1) {
        const downPixel = (y + 1) * width + x
        const canDown = !visited[downPixel] && matches(downPixel * 4)
        if (canDown && !spanDown) {
          stack.push(downPixel)
          spanDown = true
        } else if (!canDown) {
          spanDown = false
        }
      }

      x++
    }
  }

  return { filled }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex.trim()) ? hex.trim() : '#ffffff'

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}
