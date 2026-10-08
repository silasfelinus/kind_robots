// /utils/arcade/pinball/render/dmdTexture.ts
//
// The DMD's picture on the backbox (conductor kind-pinball/t-006): the 128x32
// dot framebuffer painted as round amber dots on a black glass, at a fixed
// pitch so the grid always reads as dots. The canvas becomes the emissive
// map of the DMD panel; the brightest dots are bright enough to bloom.

import { DMD_COLS, DMD_ROWS } from '../dmd'

/** Canvas pixels per dot. */
export const DMD_PITCH = 8

/** Dot colours by level, off to full: an unlit dot still shows faintly. */
const DOT_GLOW = ['#170903', '#4a1a06', '#b8430c', '#ff9a3c'] as const

export function createDmdCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = DMD_COLS * DMD_PITCH
  canvas.height = DMD_ROWS * DMD_PITCH
  return canvas
}

/** Paint the framebuffer as dots: one path per level keeps it to four fills. */
export function paintDmd(g: CanvasRenderingContext2D, buf: Uint8Array) {
  g.fillStyle = '#000'
  g.fillRect(0, 0, DMD_COLS * DMD_PITCH, DMD_ROWS * DMD_PITCH)
  const r = DMD_PITCH * 0.4
  for (let level = 0; level < DOT_GLOW.length; level++) {
    g.fillStyle = DOT_GLOW[level]!
    g.beginPath()
    for (let y = 0; y < DMD_ROWS; y++) {
      for (let x = 0; x < DMD_COLS; x++) {
        if (buf[y * DMD_COLS + x] !== level) continue
        const cx = (x + 0.5) * DMD_PITCH
        const cy = (y + 0.5) * DMD_PITCH
        g.moveTo(cx + r, cy)
        g.arc(cx, cy, r, 0, Math.PI * 2)
      }
    }
    g.fill()
  }
}
