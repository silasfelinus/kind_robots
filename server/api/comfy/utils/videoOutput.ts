// /server/api/comfy/utils/videoOutput.ts
//
// Shared "how does a queued image-to-video workflow save its result" tail,
// used by both the WAN and LTX builders. Two shapes:
//   - webp: the decoded IMAGE batch goes straight into SaveAnimatedWEBP (a
//     native ComfyUI node — no CreateVideo/SaveVideo, no custom node install).
//     ComfyUI has no native GIF encoder, so animated WebP is the actual best
//     "works well on the web" default: smaller + higher quality than GIF for
//     a short looping clip, and the site already uses .webp for the static
//     logo. Renders as a plain <img>, loops natively.
//   - mp4 / webm: the existing CreateVideo -> SaveVideo path, with the
//     container driven by the requested format instead of a fixed 'auto'.
//
// SaveAnimatedWEBP's input names (images/filename_prefix/fps/lossless/quality/
// method) match ComfyUI core's long-stable node signature but are unverified
// against this specific install — flag if the first webp render errors.

export type VideoOutputFormat = 'webp' | 'mp4' | 'webm'

export const DEFAULT_VIDEO_OUTPUT_FORMAT: VideoOutputFormat = 'webp'

const VALID_VIDEO_OUTPUT_FORMATS: readonly VideoOutputFormat[] = [
  'webp',
  'mp4',
  'webm',
]

export function normalizeVideoOutputFormat(value: unknown): VideoOutputFormat {
  const candidate = String(value ?? '').toLowerCase()
  return (VALID_VIDEO_OUTPUT_FORMATS as readonly string[]).includes(candidate)
    ? (candidate as VideoOutputFormat)
    : DEFAULT_VIDEO_OUTPUT_FORMAT
}

type VideoOutputNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export function buildVideoOutputNodes(input: {
  format: VideoOutputFormat
  imagesRef: [string, number]
  fps: number
  filenamePrefix: string
}): Record<string, VideoOutputNode> {
  if (input.format === 'webp') {
    return {
      save_output: {
        inputs: {
          images: input.imagesRef,
          filename_prefix: input.filenamePrefix,
          fps: input.fps,
          lossless: false,
          quality: 90,
          method: 'default',
        },
        class_type: 'SaveAnimatedWEBP',
        _meta: { title: 'Save Animated WebP' },
      },
    }
  }

  return {
    create_video_output: {
      inputs: { fps: input.fps, images: input.imagesRef },
      class_type: 'CreateVideo',
      _meta: { title: 'Create Video' },
    },
    save_output: {
      inputs: {
        filename_prefix: input.filenamePrefix,
        format: input.format === 'webm' ? 'webm' : 'auto',
        codec: 'auto',
        video: ['create_video_output', 0],
      },
      class_type: 'SaveVideo',
      _meta: { title: 'Save Video' },
    },
  }
}
