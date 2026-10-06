// /stores/helpers/musicVideoCompositor.ts
//
// The stage renderer for the music video creator (music-video/t-014). One
// renderer powers scrub-preview and MP4 export, so what you scrub is what you
// export. It is driven by the scenes alone (plus a way to look up each scene's
// still), so it runs against fixtures with no song, server or WebCodecs.
//
// The timing and Ken Burns math deliberately mirror Conductor's headless ffmpeg
// pipeline (scripts/build_music_video.py: scene_durations, ken_burns_expressions,
// KEN_BURNS_ZOOM) so the browser and the relay produce the same cut:
//  - a scene lasts until the next scene starts, the last one until its own end;
//  - a crossfade into a scene runs from that scene's start for transitionSec,
//    and the scene before it is held through the fade;
//  - Ken Burns progress runs 0..1 across the scene's own length.
//
// The pure half (everything above `drawStage`) has no DOM imports.
import type { MusicVideoAspect, MusicVideoScene } from '@/utils/musicVideoDoc'
import {
  sceneKenBurnsPreset,
  type MusicVideoKenBurnsPreset,
} from '@/utils/musicVideoMotion'

/** Mirrors KEN_BURNS_ZOOM in scripts/build_music_video.py. */
export const KEN_BURNS_ZOOM = 0.15

export type StageSegment = {
  index: number
  sceneId: string
  startSec: number
  /** Seconds the scene is on stage, including a crossfade out into the next. */
  durationSec: number
  preset: MusicVideoKenBurnsPreset
  /** How this scene ENTERS from the previous one. */
  transition: 'cut' | 'crossfade'
  transitionSec: number
}

export type StageLayer = {
  index: number
  alpha: number
  /** 0..1 across the scene's own length. */
  progress: number
}

export type SourceRect = { x: number; y: number; width: number; height: number }

const round3 = (n: number) => Math.round(n * 1000) / 1000
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Build the segments the renderer walks, from scenes in time order. */
export function buildStageSegments(scenes: MusicVideoScene[]): StageSegment[] {
  const ordered = [...scenes].sort((a, b) => a.startSec - b.startSec)
  return ordered.map((scene, index) => {
    const following = ordered[index + 1]
    let durationSec = following
      ? following.startSec - scene.startSec
      : scene.endSec - scene.startSec
    if (following?.transition === 'crossfade') {
      durationSec += following.transitionSec
    }
    const fades = scene.transition === 'crossfade' && scene.transitionSec > 0
    return {
      index,
      sceneId: scene.id,
      startSec: scene.startSec,
      durationSec: round3(Math.max(durationSec, 0)),
      preset: sceneKenBurnsPreset(scene, index),
      transition: index > 0 && fades ? 'crossfade' : 'cut',
      transitionSec: index > 0 && fades ? scene.transitionSec : 0,
    }
  })
}

/** Total seconds on stage: the last scene's end. */
export function stageDurationSec(segments: StageSegment[]): number {
  const last = segments[segments.length - 1]
  return last ? round3(last.startSec + last.durationSec) : 0
}

/**
 * Which scenes are visible at time t, bottom layer first. Before the first
 * scene the first scene holds; after the last it holds its final frame. Inside
 * a crossfade the outgoing scene stays opaque beneath the incoming one, which
 * fades in on top (the same picture ffmpeg's xfade=fade produces).
 */
export function stageLayersAt(
  segments: StageSegment[],
  timeSec: number,
): StageLayer[] {
  if (!segments.length) return []
  const first = segments[0] as StageSegment
  const t = Math.max(timeSec, first.startSec)
  let current = first
  for (const segment of segments) {
    if (t >= segment.startSec) current = segment
    else break
  }
  const progressOf = (segment: StageSegment, at: number) =>
    segment.durationSec > 0
      ? clamp01((at - segment.startSec) / segment.durationSec)
      : 1

  const layers: StageLayer[] = []
  if (
    current.transition === 'crossfade' &&
    current.index > 0 &&
    t < current.startSec + current.transitionSec
  ) {
    const outgoing = segments[current.index - 1] as StageSegment
    layers.push({
      index: outgoing.index,
      alpha: 1,
      progress: progressOf(outgoing, t),
    })
    layers.push({
      index: current.index,
      alpha: clamp01((t - current.startSec) / current.transitionSec),
      progress: progressOf(current, t),
    })
    return layers
  }
  return [{ index: current.index, alpha: 1, progress: progressOf(current, t) }]
}

/** Zoom and pan (0..1 of the free space on each axis) at a point in a preset. */
export function kenBurnsAt(
  preset: MusicVideoKenBurnsPreset,
  progress: number,
): { zoom: number; panX: number; panY: number } {
  const p = clamp01(progress)
  const zMax = 1 + KEN_BURNS_ZOOM
  switch (preset) {
    case 'zoom-out':
      return { zoom: zMax - KEN_BURNS_ZOOM * p, panX: 0.5, panY: 0.5 }
    case 'pan-right':
      return { zoom: zMax, panX: p, panY: 0.5 }
    case 'pan-left':
      return { zoom: zMax, panX: 1 - p, panY: 0.5 }
    default:
      return { zoom: 1 + KEN_BURNS_ZOOM * p, panX: 0.5, panY: 0.5 }
  }
}

/**
 * The part of a source image to draw so it fills the stage (cover fit, crop
 * not stretch, per music-video/t-026) with Ken Burns applied on top.
 */
export function sourceRectFor(
  srcWidth: number,
  srcHeight: number,
  stageWidth: number,
  stageHeight: number,
  preset: MusicVideoKenBurnsPreset,
  progress: number,
): SourceRect {
  const stageAspect = stageWidth / stageHeight
  let coverW = srcWidth
  let coverH = srcWidth / stageAspect
  if (coverH > srcHeight) {
    coverH = srcHeight
    coverW = srcHeight * stageAspect
  }
  const coverX = (srcWidth - coverW) / 2
  const coverY = (srcHeight - coverH) / 2
  const { zoom, panX, panY } = kenBurnsAt(preset, progress)
  const width = coverW / zoom
  const height = coverH / zoom
  return {
    x: coverX + (coverW - width) * panX,
    y: coverY + (coverH - height) * panY,
    width,
    height,
  }
}

/** Even pixel dimensions for an aspect (H.264 needs even sides). */
export function stageSizeFor(
  aspect: MusicVideoAspect,
  longSide = 1280,
): { width: number; height: number } {
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)
  if (aspect === '9:16')
    return { width: even((longSide * 9) / 16), height: even(longSide) }
  if (aspect === '1:1')
    return {
      width: even((longSide * 9) / 16),
      height: even((longSide * 9) / 16),
    }
  return { width: even(longSide), height: even((longSide * 9) / 16) }
}

/** Timestamps (seconds) of every frame in [0, durationSec). */
export function frameCount(durationSec: number, fps: number): number {
  return Math.max(0, Math.ceil(durationSec * fps - 1e-9))
}

export function frameTimeSec(frame: number, fps: number): number {
  return round3(frame / fps)
}

/** A decoded still (or the current frame of a clip) the compositor can draw. */
export type StageImage = {
  image: CanvasImageSource
  width: number
  height: number
  /**
   * A clip already moves, so it is drawn cover-cropped with no pan or zoom on
   * top (the ffmpeg path's scale+crop for clips). Stills default to Ken Burns.
   */
  kenBurns?: boolean
}

/** Centre crop of a source to the stage's aspect, no zoom (ffmpeg's cover crop). */
export function coverRect(
  sourceWidth: number,
  sourceHeight: number,
  stageWidth: number,
  stageHeight: number,
): SourceRect {
  const stageAspect = stageWidth / stageHeight
  const sourceAspect = sourceWidth / sourceHeight
  if (sourceAspect > stageAspect) {
    const width = sourceHeight * stageAspect
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight }
  }
  const height = sourceWidth / stageAspect
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height }
}

/**
 * Draw one frame. `images` is parallel to `segments`; a scene with no still
 * paints black so a half-finished video still scrubs.
 */
export function drawStage(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  segments: StageSegment[],
  images: (StageImage | null)[],
  timeSec: number,
  stageWidth: number,
  stageHeight: number,
): void {
  ctx.globalAlpha = 1
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, stageWidth, stageHeight)
  for (const layer of stageLayersAt(segments, timeSec)) {
    const segment = segments[layer.index]
    const still = images[layer.index]
    if (!segment || !still) continue
    const r =
      still.kenBurns === false
        ? coverRect(still.width, still.height, stageWidth, stageHeight)
        : sourceRectFor(
            still.width,
            still.height,
            stageWidth,
            stageHeight,
            segment.preset,
            layer.progress,
          )
    ctx.globalAlpha = layer.alpha
    ctx.drawImage(
      still.image,
      r.x,
      r.y,
      r.width,
      r.height,
      0,
      0,
      stageWidth,
      stageHeight,
    )
  }
  ctx.globalAlpha = 1
}
