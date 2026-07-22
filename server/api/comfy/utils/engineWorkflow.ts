// /server/api/comfy/utils/engineWorkflow.ts
//
// Rebuild a render's Comfy workflow for a DIFFERENT engine, carrying over the
// prompt / negative / size / seed from the source job. This is what powers the
// "re-render this on Klein / SDXL / Krea" presets in the ArtJobs retry UI:
// switching engine is not a node patch (each engine has its own graph — loaders,
// CLIP type, VAE) so the graph is rebuilt, not edited.
import { buildDefaultComfyWorkflow } from '../sdxl/utils/workflow'
import { buildFluxWorkflowFromRequest } from '../flux/utils/workflow'
import { buildKrea2WorkflowFromRequest } from '../krea2/utils/workflow'
import { buildFlux2KleinWorkflowFromRequest } from '../flux2/utils/workflow'
import type { ComfyWorkflow } from './simpleCheckpointWorkflow'

export type ImageEngine = 'comfy' | 'flux' | 'krea2' | 'flux2'

// Preset name (as sent from the UI) -> concrete graph engine. `custom` is
// absent on purpose: it means "no rebuild, just apply the manual overrides".
export const ENGINE_PRESETS: Record<string, ImageEngine> = {
  comfy: 'comfy',
  sdxl: 'comfy',
  flux: 'flux',
  'flux-dev': 'flux',
  krea2: 'krea2',
  krea: 'krea2',
  'krea2-turbo': 'krea2',
  flux2: 'flux2',
  klein: 'flux2',
  'flux2-klein': 'flux2',
}

export function resolvePresetEngine(preset: unknown): ImageEngine | null {
  const key = String(preset || '')
    .trim()
    .toLowerCase()
  if (!key || key === 'custom' || key === 'keep') return null
  return ENGINE_PRESETS[key] ?? null
}

type RenderRequest = {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  seed: number | null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

// Pull the reusable render inputs out of a source payload — works for both the
// graph engines (reads the workflow nodes) and the raw A1111 path (top-level).
export function extractRenderRequest(payload: unknown): RenderRequest {
  const record = asRecord(payload)
  const workflow = asRecord(record.workflow)

  let prompt = str(record.promptString) || str(record.prompt)
  let negativePrompt = str(record.negativePrompt)
  let width = num(record.width)
  let height = num(record.height)
  let seed: number | null = num(record.seed)

  for (const node of Object.values(workflow)) {
    const nodeRecord = asRecord(node)
    const classType = String(nodeRecord.class_type || '')
    const inputs = asRecord(nodeRecord.inputs)
    const title = String(asRecord(nodeRecord._meta).title || '').toLowerCase()

    if (classType === 'CLIPTextEncode' || classType === 'ImpactWildcardEncode') {
      const text = str(inputs.text) || str(inputs.wildcard_text)
      if (text) {
        if (title.includes('negative')) {
          if (!negativePrompt) negativePrompt = text
        } else if (!prompt) {
          prompt = text
        }
      }
    }
    if (classType === 'EmptyLatentImage') {
      width = width ?? num(inputs.width)
      height = height ?? num(inputs.height)
    }
    if (seed === null) {
      seed = num(inputs.seed) ?? num(inputs.noise_seed)
    }
  }

  return {
    prompt,
    negativePrompt,
    width: width ?? 1024,
    height: height ?? 1024,
    seed,
  }
}

// Force every EmptyLatentImage node to the requested size, so switching to an
// engine whose builder hardcodes the latent (SDXL) still respects the source
// aspect ratio.
function applyLatentSize(
  workflow: ComfyWorkflow,
  width: number,
  height: number,
): void {
  for (const node of Object.values(workflow)) {
    if (node?.class_type === 'EmptyLatentImage' && node.inputs) {
      node.inputs.width = width
      node.inputs.height = height
    }
  }
}

// Build a fresh COMFY workflow for the target engine from the carried-over
// render request. A null seed lets the builder randomize (fresh attempt).
export function buildWorkflowForEngine(
  engine: ImageEngine,
  req: RenderRequest,
): ComfyWorkflow {
  let workflow: ComfyWorkflow

  if (engine === 'flux') {
    workflow = buildFluxWorkflowFromRequest({
      variant: 'dev',
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      width: req.width,
      height: req.height,
      seed: req.seed,
    }).workflow
  } else if (engine === 'krea2') {
    workflow = buildKrea2WorkflowFromRequest({
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      width: req.width,
      height: req.height,
      seed: req.seed,
    }).workflow
  } else if (engine === 'flux2') {
    workflow = buildFlux2KleinWorkflowFromRequest({
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      width: req.width,
      height: req.height,
      seed: req.seed,
    }).workflow
  } else {
    // comfy / sdxl
    workflow = buildDefaultComfyWorkflow({
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      cfgValue: 3,
      seed: req.seed,
    })
  }

  applyLatentSize(workflow, req.width, req.height)
  return workflow
}
