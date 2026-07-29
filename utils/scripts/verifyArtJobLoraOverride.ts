import assert from 'node:assert/strict'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'

// Style-LoRA override: repoint a job's selected style LoRA without rebuilding
// it. This is the in-place fix for a stored lora_name that no longer resolves
// (e.g. an old HF repo-id like `UmeAiRT/FLUX.1-dev-LoRA-Impressionism`).

// 1. Single style LoRA (kontext #2603 shape) is swapped; metadata follows.
{
  const payload: Record<string, unknown> = {
    resources: { loraNames: ['UmeAiRT/FLUX.1-dev-LoRA-Impressionism'] },
    workflow: {
      '61': {
        class_type: 'LoraLoaderModelOnly',
        inputs: {
          model: ['59', 0],
          lora_name: 'UmeAiRT/FLUX.1-dev-LoRA-Impressionism',
          strength_model: 1,
        },
        _meta: { title: 'Style LoRA' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, {
    loraName: 'Flux/NSFW/ume_classic_impressionist.safetensors',
    loraStrength: 0.8,
  })
  const node = (out.workflow as any)['61'].inputs
  assert.equal(node.lora_name, 'Flux/NSFW/ume_classic_impressionist.safetensors')
  assert.equal(node.strength_model, 0.8)
  assert.equal(out.loraName, 'Flux/NSFW/ume_classic_impressionist.safetensors')
  assert.equal(out.loraStrength, 0.8)
  assert.deepEqual((out.resources as any).loraNames, [
    'Flux/NSFW/ume_classic_impressionist.safetensors',
  ])
}

// 2. Required/base LoRA is left alone; only the selected style LoRA moves
//    (LTX: a distilled acceleration LoRA + a user style LoRA).
{
  const payload: Record<string, unknown> = {
    workflow: {
      '293': {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'ltx-2.3-22b-distilled-lora-384.safetensors', strength_model: 0.5 },
        _meta: { title: 'Load Required LTX Distilled LoRA' },
      },
      video_lora: {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'old/style.safetensors', strength_model: 1 },
        _meta: { title: 'Load Selected LTX LoRA' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, { loraName: 'Video/SFW/new_style.safetensors' })
  assert.equal(
    (out.workflow as any)['293'].inputs.lora_name,
    'ltx-2.3-22b-distilled-lora-384.safetensors',
    'required distilled LoRA must not be overridden',
  )
  assert.equal(
    (out.workflow as any).video_lora.inputs.lora_name,
    'Video/SFW/new_style.safetensors',
  )
}

// 3. WAN applies the style LoRA to both expert passes.
{
  const payload: Record<string, unknown> = {
    workflow: {
      lora_high: {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'a.safetensors', strength_model: 1 },
        _meta: { title: 'Load Selected WAN LoRA (High Noise)' },
      },
      lora_low: {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'a.safetensors', strength_model: 1 },
        _meta: { title: 'Load Selected WAN LoRA (Low Noise)' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, { loraName: 'Video/SFW/b.safetensors' })
  assert.equal((out.workflow as any).lora_high.inputs.lora_name, 'Video/SFW/b.safetensors')
  assert.equal((out.workflow as any).lora_low.inputs.lora_name, 'Video/SFW/b.safetensors')
}

// 4. No loraName override -> the style LoRA is untouched.
{
  const payload: Record<string, unknown> = {
    workflow: {
      '61': {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'keep/me.safetensors', strength_model: 1 },
        _meta: { title: 'Style LoRA' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, { seed: 42 })
  assert.equal((out.workflow as any)['61'].inputs.lora_name, 'keep/me.safetensors')
  assert.equal(out.loraName, undefined)
}

// 5. Non-LoRA nodes are never touched by a loraName override.
{
  const payload: Record<string, unknown> = {
    workflow: {
      '24': {
        class_type: 'UnetLoaderGGUF',
        inputs: { unet_name: 'flux1-dev-Q8_0.gguf' },
        _meta: { title: 'Unet Loader (GGUF)' },
      },
    },
  }
  const out = applyArtJobOverrides(payload, { loraName: 'x/y.safetensors' })
  assert.equal((out.workflow as any)['24'].inputs.unet_name, 'flux1-dev-Q8_0.gguf')
  assert.ok(!('lora_name' in (out.workflow as any)['24'].inputs))
}

console.log('✅ verifyArtJobLoraOverride: all assertions passed')
