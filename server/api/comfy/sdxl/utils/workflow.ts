// /server/api/comfy/sdxl/utils/workflow.ts
//
// Shared default SDXL/Comfy workflow builder + patcher. Extracted from
// ../generate.post.ts so both the direct/relay render route and the
// queue-based enqueue endpoint (/api/art/enqueue) build the same Comfy graph
// and apply prompt/seed/sampler overrides identically.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

// The generation params the builder/patcher consume (the direct route's
// GenerateComfyImageInput minus the transport-only server/workflow fields).
export type ComfyWorkflowInput = {
  prompt: string
  cfgValue: number
  negativePrompt?: string
  seed?: number | null
  steps?: number
  checkpoint?: string | null
  sampler?: string | null
}

export function normalizeComfySampler(sampler?: string | null): string {
  const value = sampler?.trim()

  if (!value) return 'euler'

  const lookup: Record<string, string> = {
    'Euler a': 'euler_ancestral',
    Euler: 'euler',
    LMS: 'lms',
    Heun: 'heun',
    DPM2: 'dpm_2',
    'DPM2 a': 'dpm_2_ancestral',
    DDIM: 'ddim',
  }

  return lookup[value] || value
}

function getNodeTitle(node: ComfyWorkflowNode): string {
  const title = node._meta?.title

  return typeof title === 'string' ? title : ''
}

function assignIfKeyExists(
  inputs: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  if (key in inputs) {
    inputs[key] = value
  }
}

// Apply the request's prompt/seed/steps/cfg/sampler/checkpoint onto a
// caller-supplied Comfy workflow, matching nodes by class_type + title.
export function patchComfyWorkflow(
  workflow: ComfyWorkflow,
  input: ComfyWorkflowInput,
): void {
  const positiveText = input.prompt
  const negativeText = input.negativePrompt || ''
  const seed = input.seed ?? -1
  const steps = input.steps ?? 20
  const cfg = input.cfgValue || 3
  const sampler = normalizeComfySampler(input.sampler)
  const checkpoint = input.checkpoint || ''

  for (const node of Object.values(workflow)) {
    if (!node?.inputs) continue

    const classType = node.class_type || ''
    const title = getNodeTitle(node)

    if (classType === 'CheckpointLoaderSimple' && checkpoint) {
      assignIfKeyExists(node.inputs, 'ckpt_name', checkpoint)
    }

    if (classType === 'KSampler') {
      assignIfKeyExists(node.inputs, 'seed', seed)
      assignIfKeyExists(node.inputs, 'steps', steps)
      assignIfKeyExists(node.inputs, 'cfg', cfg)
      assignIfKeyExists(node.inputs, 'sampler_name', sampler)
    }

    if (classType === 'CLIPTextEncode') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'text', negativeText)
      } else if (label.includes('positive') || label.includes('prompt')) {
        assignIfKeyExists(node.inputs, 'text', positiveText)
      }
    }

    if (classType === 'CLIPTextEncodeFlux') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'clip_l', negativeText)
        assignIfKeyExists(node.inputs, 't5xxl', negativeText)
      } else {
        assignIfKeyExists(node.inputs, 'clip_l', positiveText)
        assignIfKeyExists(node.inputs, 't5xxl', positiveText)
      }
    }

    if ('noise_seed' in node.inputs) {
      node.inputs.noise_seed = seed
    }

    if ('guidance' in node.inputs) {
      node.inputs.guidance = cfg
    }

    if ('denoise' in node.inputs && typeof node.inputs.denoise !== 'number') {
      node.inputs.denoise = 1
    }
  }
}

export function buildDefaultComfyWorkflow({
  prompt,
  negativePrompt,
  cfgValue,
  seed,
  steps,
  checkpoint,
  sampler,
}: ComfyWorkflowInput): ComfyWorkflow {
  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint || 'v1-5-pruned-emaonly.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
      _meta: {
        title: 'Positive Prompt',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt || '',
        clip: ['1', 1],
      },
      _meta: {
        title: 'Negative Prompt',
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: 1024,
        height: 1024,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: seed ?? -1,
        steps: steps ?? 20,
        cfg: cfgValue || 3,
        sampler_name: normalizeComfySampler(sampler),
        scheduler: 'normal',
        denoise: 1,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'kindrobots',
        images: ['6', 0],
      },
    },
  }
}
