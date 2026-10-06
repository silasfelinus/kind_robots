// /stores/helpers/musicVideoExporter.ts
//
// Browser MP4 export for the music video creator (music-video/t-014): the
// compositor's frames encoded with WebCodecs and muxed by mediabunny, with the
// song as the AAC audio track. Chromium-first, admin-only. Dependency choice:
// mediabunny over mp4-muxer (mp4-muxer's own README points to it as its
// successor); its CanvasSource and AudioBufferSource do the VideoEncoder and
// AudioEncoder plumbing, so this file stays small.
//
// Not covered here (later upgrades): save-to-server and a relay ffmpeg job.
import {
  drawStage,
  frameCount,
  frameTimeSec,
  buildStageSegments,
  stageDurationSec,
  stageSizeFor,
  type StageImage,
} from './musicVideoCompositor'
import type { MusicVideoDoc } from '@/utils/musicVideoDoc'

export type ExportInput = {
  doc: MusicVideoDoc
  songUrl?: string | null
  /** The still for a scene, by scene id; null when it has none yet. */
  imageUrlFor: (sceneId: string) => string | null
  /** Private rows need the Bearer header on every fetch. */
  headers?: HeadersInit
  fps?: number
  onProgress?: (fraction: number, label: string) => void
  signal?: AbortSignal
}

export function webCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof AudioEncoder !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined'
  )
}

async function loadImage(
  url: string,
  headers?: HeadersInit,
  signal?: AbortSignal,
): Promise<StageImage> {
  const response = await fetch(url, { headers, signal })
  if (!response.ok)
    throw new Error(`Could not load still (${response.status}).`)
  const bitmap = await createImageBitmap(await response.blob())
  return { image: bitmap, width: bitmap.width, height: bitmap.height }
}

/** Render the doc to an MP4 and return it as a Blob. */
export async function exportMusicVideoMp4(input: ExportInput): Promise<Blob> {
  if (!webCodecsSupported()) {
    throw new Error(
      'This browser has no WebCodecs; use a current Chrome or Edge.',
    )
  }
  const {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    AudioBufferSource,
    QUALITY_HIGH,
    canEncodeVideo,
    canEncodeAudio,
  } = await import('mediabunny')

  const fps = input.fps ?? 30
  const { doc, onProgress, signal } = input
  const segments = buildStageSegments(doc.scenes)
  if (!segments.length) throw new Error('Plan scenes before exporting.')
  const { width, height } = stageSizeFor(doc.settings.aspect)

  onProgress?.(0, 'Loading stills')
  const images: (StageImage | null)[] = []
  for (const segment of segments) {
    const url = input.imageUrlFor(segment.sceneId)
    images.push(url ? await loadImage(url, input.headers, signal) : null)
  }

  let audio: AudioBuffer | null = null
  if (input.songUrl) {
    onProgress?.(0, 'Decoding song')
    const response = await fetch(input.songUrl, {
      headers: input.headers,
      signal,
    })
    if (!response.ok)
      throw new Error(`Could not load the song (${response.status}).`)
    const context = new AudioContext()
    try {
      audio = await context.decodeAudioData(await response.arrayBuffer())
    } finally {
      await context.close()
    }
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a drawing surface.')

  const target = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat(), target })
  // H.264 plays everywhere; VP9-in-MP4 is the fallback for browsers (open
  // Chromium builds) with no H.264 encoder.
  let codec: 'avc' | 'vp9' | null = null
  for (const candidate of ['avc', 'vp9'] as const) {
    if (
      await canEncodeVideo(candidate, { width, height, bitrate: QUALITY_HIGH })
    ) {
      codec = candidate
      break
    }
  }
  if (!codec) throw new Error('This browser cannot encode H.264 or VP9 video.')
  if (audio && !(await canEncodeAudio('aac'))) {
    throw new Error('This browser cannot encode AAC audio.')
  }
  const video = new CanvasSource(canvas, { codec, bitrate: QUALITY_HIGH })
  output.addVideoTrack(video, { frameRate: fps })
  const sound = audio
    ? new AudioBufferSource({ codec: 'aac', bitrate: QUALITY_HIGH })
    : null
  if (sound) output.addAudioTrack(sound)

  await output.start()
  try {
    // The video runs to the last scene's end; the song is added whole, so keep
    // the doc duration and the song length in step.
    const total = frameCount(stageDurationSec(segments), fps)
    for (let frame = 0; frame < total; frame++) {
      if (signal?.aborted)
        throw new DOMException('Export cancelled.', 'AbortError')
      const t = frameTimeSec(frame, fps)
      drawStage(ctx, segments, images, t, width, height)
      await video.add(t, 1 / fps)
      if (frame % 15 === 0)
        onProgress?.((frame / total) * 0.95, 'Encoding frames')
    }
    if (sound && audio) {
      onProgress?.(0.96, 'Encoding audio')
      await sound.add(audio)
    }
    await output.finalize()
  } catch (error) {
    await output.cancel()
    throw error
  }
  onProgress?.(1, 'Done')
  const buffer = target.buffer
  if (!buffer) throw new Error('The encoder produced no file.')
  return new Blob([buffer], { type: 'video/mp4' })
}
