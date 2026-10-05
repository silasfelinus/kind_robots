import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'
import {
  applyResolvedLoraResourceToArtJobPayload,
  applyResolvedLoraResourcesToArtJobPayload,
} from '../../server/utils/artJobResourceRefresh'

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

// 6. Job 2615 refreshes Resource 4082 instead of preserving the stale payload.
{
  const refresh = applyResolvedLoraResourceToArtJobPayload(
    {
      loraName: 'FLUX\\impressionist.safetensors',
      resources: {
        loraResourceIds: [4082],
        loraNames: ['FLUX\\impressionist.safetensors'],
      },
      workflow: {
        '61': {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'FLUX\\impressionist.safetensors',
            strength_model: 1,
          },
          _meta: { title: 'Style LoRA' },
        },
      },
    },
    {
      id: 4082,
      localPath: 'Flux/SFW/ume_classic_impressionist.safetensors',
    },
  )

  assert.equal(refresh.changed, true)
  assert.deepEqual(refresh.loraResourceIds, [4082])
  assert.deepEqual(refresh.loraNames, [
    'Flux/SFW/ume_classic_impressionist.safetensors',
  ])
  assert.equal(
    (refresh.payload.workflow as any)['61'].inputs.lora_name,
    'Flux/SFW/ume_classic_impressionist.safetensors',
  )
  assert.equal(
    refresh.payload.loraName,
    'Flux/SFW/ume_classic_impressionist.safetensors',
  )
  assert.deepEqual((refresh.payload.resources as any).loraNames, [
    'Flux/SFW/ume_classic_impressionist.safetensors',
  ])
}

// 7. Job 2621 keeps the Resource's Kontext folder and exact path casing.
{
  const refresh = applyResolvedLoraResourceToArtJobPayload(
    {
      resources: {
        loraResourceIds: [1300],
        loraNames: ['FLUX/manuscript_illustration_kontext.safetensors'],
      },
      workflow: {
        '61': {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'FLUX/manuscript_illustration_kontext.safetensors',
            strength_model: 1,
          },
          _meta: { title: 'Style LoRA' },
        },
      },
    },
    {
      id: 1300,
      localPath: 'Kontext\\SFW\\manuscript_illustration_kontext.safetensors',
    },
  )

  assert.deepEqual(refresh.loraNames, [
    'Kontext/SFW/manuscript_illustration_kontext.safetensors',
  ])
  assert.equal(
    (refresh.payload.workflow as any)['61'].inputs.lora_name,
    'Kontext/SFW/manuscript_illustration_kontext.safetensors',
  )
  assert.ok(!JSON.stringify(refresh.payload).includes('FLUX/'))
  assert.ok(!JSON.stringify(refresh.payload).includes('\\\\'))
}

// 8. A stacked job refreshes every LoRA Resource path in order without
//    changing strengths or touching a required/base LoRA.
{
  const refresh = applyResolvedLoraResourcesToArtJobPayload(
    {
      loraName: 'old/first.safetensors',
      loraResourceIds: [11, 22, 33],
      resources: {
        loraResourceIds: [11, 22, 33],
        loraNames: [
          'old/first.safetensors',
          'old/second.safetensors',
          'old/third.safetensors',
        ],
      },
      workflow: {
        required: {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'required/base-acceleration.safetensors',
            strength_model: 0.5,
          },
          _meta: { title: 'Load Required Base LoRA' },
        },
        first: {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'old/first.safetensors',
            strength_model: 0.9,
          },
          _meta: { title: 'Style LoRA 1', krLoraIndex: 0 },
        },
        second: {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'old/second.safetensors',
            strength_model: 0.6,
          },
          _meta: { title: 'Style LoRA 2', krLoraIndex: 1 },
        },
        third: {
          class_type: 'LoraLoaderModelOnly',
          inputs: {
            lora_name: 'old/third.safetensors',
            strength_model: 0.3,
          },
          _meta: { title: 'Style LoRA 3', krLoraIndex: 2 },
        },
      },
    },
    [
      { id: 11, localPath: 'Flux/SFW/first.safetensors' },
      { id: 22, localPath: 'Flux/SFW/second.safetensors' },
      { id: 33, localPath: 'Flux/SFW/third.safetensors' },
    ],
  )

  const workflow = refresh.payload.workflow as any
  assert.equal(
    workflow.required.inputs.lora_name,
    'required/base-acceleration.safetensors',
    'required/base LoRA must not move during stack refresh',
  )
  assert.deepEqual(
    [workflow.first, workflow.second, workflow.third].map(
      (node: any) => node.inputs.lora_name,
    ),
    [
      'Flux/SFW/first.safetensors',
      'Flux/SFW/second.safetensors',
      'Flux/SFW/third.safetensors',
    ],
  )
  assert.deepEqual(
    [workflow.first, workflow.second, workflow.third].map(
      (node: any) => node.inputs.strength_model,
    ),
    [0.9, 0.6, 0.3],
    'refreshing current Resource paths must preserve per-LoRA strengths',
  )
  assert.deepEqual(refresh.loraResourceIds, [11, 22, 33])
  assert.deepEqual(refresh.loraNames, [
    'Flux/SFW/first.safetensors',
    'Flux/SFW/second.safetensors',
    'Flux/SFW/third.safetensors',
  ])
  assert.deepEqual((refresh.payload.resources as any).loraResourceIds, [
    11, 22, 33,
  ])
  assert.deepEqual((refresh.payload.resources as any).loraNames, [
    'Flux/SFW/first.safetensors',
    'Flux/SFW/second.safetensors',
    'Flux/SFW/third.safetensors',
  ])
  assert.equal(refresh.payload.loraName, 'Flux/SFW/first.safetensors')
}

// 9. Every route that returns an existing ArtJob to PENDING must refresh the

//    current Resource path first. This guards the dashboard's "Resume unchanged"
//    route, which was separate from the two re-enqueue routes.
{
  const routes = [
    '../../server/api/art/queue/[id]/requeue.post.ts',
    '../../server/api/art/queue/[id]/edit.post.ts',
    '../../server/api/art/queue/[id]/reenqueue.post.ts',
    '../../server/api/art/queue/reenqueue-failed.post.ts',
  ]

  for (const route of routes) {
    const source = readFileSync(new URL(route, import.meta.url), 'utf8')
    assert.match(
      source,
      /await refreshArtJobLoraResources\(/,
      `${route} must refresh LoRA Resources before queueing`,
    )
  }
}

console.log('✅ verifyArtJobLoraOverride: all assertions passed')