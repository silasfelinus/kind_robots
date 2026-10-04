// /server/api/comfy/utils/videoImageFit.ts
//
// How an image-to-video job fits its first (and last) frame into the clip size
// (music-video/t-026). Pure: it edits a built ComfyUI graph and nothing else.
//
// "stretch" is what every video job has always done, and it stays the default
// so Scene Animator and the Video Generator render exactly as before: LTX
// resizes with crop disabled, and WAN hands the raw image to its own node.
// "crop" scales to cover the frame and trims the overflow from the centre, so a
// 2:3 comic panel or a 1:1 sheet keeps its proportions in a 16:9 clip. The
// music video and comic film pipelines always ask for it.
export const VIDEO_IMAGE_FITS = ['stretch', 'crop'] as const
export type VideoImageFit = (typeof VIDEO_IMAGE_FITS)[number]

type Node = { class_type?: string; inputs?: Record<string, unknown> }
type Graph = Record<string, Node>

export function normalizeVideoImageFit(value: unknown): VideoImageFit {
  return value === 'crop' ? 'crop' : 'stretch'
}

const LTX_SCALE_NODES = ['img_scale', 'img_last_scale']
const WAN_IMAGE_NODES: Array<[string, string]> = [
  ['img_first', 'img_first_fit'],
  ['img_last', 'img_last_fit'],
]

function isRef(value: unknown, nodeId: string): boolean {
  return Array.isArray(value) && value[0] === nodeId
}

/**
 * Apply the fit to a built video graph in place and return it.
 * LTX already scales through ImageScale nodes, so only their crop changes.
 * WAN loads the images straight into its video node, so "crop" puts a
 * centre-cropping ImageScale in between and repoints every consumer.
 */
export function applyVideoImageFit<T extends Graph>(
  workflow: T,
  engine: 'ltx' | 'wan',
  fit: VideoImageFit,
  size: { width: number; height: number },
): T {
  if (fit !== 'crop') return workflow
  if (engine === 'ltx') {
    for (const id of LTX_SCALE_NODES) {
      const node = workflow[id]
      if (node?.class_type === 'ImageScale' && node.inputs) {
        node.inputs.crop = 'center'
      }
    }
    return workflow
  }
  for (const [loaderId, fitId] of WAN_IMAGE_NODES) {
    if (!workflow[loaderId]) continue
    for (const node of Object.values(workflow)) {
      if (!node?.inputs) continue
      for (const [key, value] of Object.entries(node.inputs)) {
        if (isRef(value, loaderId)) node.inputs[key] = [fitId, 0]
      }
    }
    ;(workflow as Graph)[fitId] = {
      inputs: {
        image: [loaderId, 0],
        upscale_method: 'lanczos',
        width: size.width,
        height: size.height,
        crop: 'center',
      },
      class_type: 'ImageScale',
    }
  }
  return workflow
}
