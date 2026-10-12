// /utils/arcade/seedLander/camera.ts
//
// The zoom-to-land camera (conductor kr-arcade/t-069): it scrolls across a wide island to keep
// the pod in view, and below about 40 px of altitude it zooms smoothly in (the classic's close-up)
// so the pod reads at 30+ px for the last few pixels of a touchdown. Cosmetic: it never touches
// the game's rng and play never reads it.

import { H, HUD_H, W } from './missions'

/** Zoom in from this altitude, all the way in by ZOOM_FULL. */
export const ZOOM_FROM = 44
export const ZOOM_FULL = 14
/** The close-up's magnification. */
export const ZOOM_MAX = 2.25

/** The play view under the HUD. */
export const VIEW_H = H - HUD_H

export class Camera {
  /** World point at the view's centre. */
  x = W / 2
  y = VIEW_H / 2
  zoom = 1

  /** How far in to be at this altitude above the floor. */
  static zoomFor(altitude: number): number {
    const t = (ZOOM_FROM - altitude) / (ZOOM_FROM - ZOOM_FULL)
    const k = Math.max(0, Math.min(1, t))
    return 1 + (ZOOM_MAX - 1) * k * k * (3 - 2 * k)
  }

  /** Jump straight to a target (a new mission). */
  snap(x: number, y: number, mapW: number, mapH: number) {
    this.zoom = 1
    this.x = x
    this.y = y
    this.clamp(mapW, mapH)
  }

  /** Ease toward the target and the zoom its altitude asks for, kept inside the map. */
  follow(
    x: number,
    y: number,
    altitude: number,
    mapW: number,
    mapH: number,
    lookAhead = 0,
  ) {
    const want = Camera.zoomFor(altitude)
    this.zoom += (want - this.zoom) * 0.08
    if (Math.abs(want - this.zoom) < 0.002) this.zoom = want
    // Zoomed in, the camera holds the pod centred; out, it leads a little the way it flies.
    const lead = lookAhead * (ZOOM_MAX - this.zoom)
    this.x += (x + lead - this.x) * 0.12
    this.y += (y - this.y) * 0.12
    this.clamp(mapW, mapH)
  }

  private clamp(mapW: number, mapH: number) {
    const halfW = W / 2 / this.zoom
    const halfH = VIEW_H / 2 / this.zoom
    this.x =
      mapW <= halfW * 2
        ? mapW / 2
        : Math.max(halfW, Math.min(mapW - halfW, this.x))
    this.y =
      mapH <= halfH * 2
        ? mapH / 2
        : Math.max(halfH, Math.min(mapH - halfH, this.y))
  }

  /** The world rectangle in view. */
  view(): { x0: number; y0: number; x1: number; y1: number } {
    const halfW = W / 2 / this.zoom
    const halfH = VIEW_H / 2 / this.zoom
    return {
      x0: this.x - halfW,
      y0: this.y - halfH,
      x1: this.x + halfW,
      y1: this.y + halfH,
    }
  }

  /** A world point on screen. */
  toScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + W / 2,
      y: (wy - this.y) * this.zoom + HUD_H + VIEW_H / 2,
    }
  }

  /** Set `g` to draw in world units through this camera (save/restore around it). */
  apply(g: CanvasRenderingContext2D) {
    g.translate(W / 2, HUD_H + VIEW_H / 2)
    g.scale(this.zoom, this.zoom)
    g.translate(-this.x, -this.y)
  }
}
