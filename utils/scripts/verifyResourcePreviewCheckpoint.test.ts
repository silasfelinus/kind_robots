// /utils/scripts/verifyResourcePreviewCheckpoint.test.ts
//
// The automatic resource preview renders through a plain named-checkpoint
// graph, so it may only pick SD-lineage image checkpoints. ArtJob 33123
// (2026-10-02) previewed an SD LoRA on 3D/hunyuan3d-dit-v2-mv-turbo because
// the endpoint trusted its GENERIC label, and ComfyUI failed at CLIPTextEncode
// with "clip input is invalid: None". The rows below are real catalog rows.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isSdLineageCheckpoint } from '../loraProbe'

const loadable: Array<[string, string | null]> = [
  ['SD15/revAnimated_v2Rebirth.safetensors', 'ARCHIVE'],
  ['Unknown/darkSushiMixMix_colorful.safetensors', '1.5'],
  ['SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors', 'SDXL'],
  ['SDXL/cartoonArcadiaSDXLSD1_v2.safetensors', 'base'],
  ['Pony/realcartoonPony_v1.safetensors', 'Pony'],
  ['Illustrious/illustrij_v21.safetensors', 'Illustrious'],
]

const notLoadable: Array<[string, string | null]> = [
  ['3D/hunyuan3d-dit-v2-mv-turbo.safetensors', 'Hunyuan'],
  ['3D/hunyuan_3d_v2.1.safetensors', 'Hunyuan'],
  ['SD15/v3_sd15_mm.ckpt', 'SD 1.5'],
  ['Audio/ace_step_v1_3.5b.safetensors', 'Other'],
  ['Audio/stable_audio_open.safetensors', 'Audio'],
  ['Video/SVD/svd_xt.safetensors', 'Other'],
  ['Video/LTX/ltx-video-2b-v0.9.safetensors', 'LTX Video'],
  ['Video/Wan/wan2.2-t2v-rapid-aio-v10-nsfw.safetensors', 'Wan Video'],
  ['Qwen/Qwen-Rapid-AIO-NSFW-v10.4.safetensors', 'Qwen'],
  ['ZImage/zImageTurboNSFW_82_FP8.safetensors', 'ZImageTurbo'],
  ['Flux/flux1-schnell-fp8.safetensors', 'Flux.1 S'],
]

for (const [localPath, generation] of loadable) {
  assert.equal(
    isSdLineageCheckpoint({ localPath, generation }),
    true,
    `${localPath} is an SD-lineage checkpoint the preview graph can load`,
  )
}

for (const [localPath, generation] of notLoadable) {
  assert.equal(
    isSdLineageCheckpoint({ localPath, generation }),
    false,
    `${localPath} must never be picked as a preview checkpoint`,
  )
}

const endpoint = readFileSync(
  new URL(
    '../../server/api/resources/[id]/generate-preview.post.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.ok(
  endpoint.includes('checkpointCandidates.filter(isSdLineageCheckpoint)'),
  'LoRA previews must filter checkpoint candidates to SD-lineage image models',
)
assert.ok(
  endpoint.includes('isCheckpoint && !isSdLineageCheckpoint(resource)'),
  'a non-image checkpoint must be refused before it is queued for its own preview',
)

console.log('verifyResourcePreviewCheckpoint: all assertions passed')
