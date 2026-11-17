import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import {
  prepareTargetedEdit,
  type TargetedEditRequest,
} from '../../server/utils/targetedInpaint'
import { buildSdxlRegionWorkflow } from '../../server/api/comfy/sdxl/utils/targetedWorkflow'

const source = await sharp({
  create: {
    width: 101,
    height: 87,
    channels: 3,
    background: '#2953bd',
  },
})
  .png()
  .toBuffer()
const imageData = 'data:image/png;base64,' + source.toString('base64')
const request: TargetedEditRequest = {
  imageData,
  mode: 'full-frame',
  bleedPx: 6,
  featherPx: 4,
  targets: [
    { type: 'box', box: [0.2, 0.2, 0.4, 0.45], bleedPx: 5 },
    {
      type: 'polygon',
      points: [
        [0.6, 0.6],
        [0.85, 0.6],
        [0.7, 0.9],
      ],
    },
  ],
}
const prepared = await prepareTargetedEdit(request)
assert.equal(prepared.originalWidth, 101)
assert.equal(prepared.originalHeight, 87)
assert.equal(prepared.sampleWidth, 104)
assert.equal(prepared.sampleHeight, 88)
assert.equal(prepared.crop.x, 0)
assert.equal(prepared.crop.y, 0)
assert.ok(prepared.sourceHash.match(/^[a-f0-9]{64}$/))

async function pixels(data: string) {
  const raw = Buffer.from(data.split(',')[1]!, 'base64')
  return sharp(raw).greyscale().raw().toBuffer({ resolveWithObject: true })
}

const hard = await pixels(prepared.noiseMaskData)
const soft = await pixels(prepared.compositeMaskData)
const idx = (x: number, y: number) => y * hard.info.width + x
assert.equal(hard.info.width, 104)
assert.equal(hard.info.height, 88)
assert.equal(hard.data[idx(0, 0)], 0)
assert.equal(soft.data[idx(0, 0)], 0)
assert.equal(hard.data[idx(25, 29)], 255)
assert.equal(hard.data[idx(72, 65)], 255)
assert.equal(hard.data[idx(50, 10)], 0)
for (let i = 0; i < hard.data.length; i++) {
  assert.ok(
    soft.data[i]! <= hard.data[i]!,
    'Feather may never expand the permitted edit footprint.',
  )
}
const fullOriginal = await sharp(
  Buffer.from(prepared.originalData.split(',')[1]!, 'base64'),
).metadata()
assert.equal(fullOriginal.width, 101)
assert.equal(fullOriginal.height, 87)

const workflow = buildSdxlRegionWorkflow({
  prompt: 'a specific anatomy edit',
  checkpoint: 'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors',
  sourceName: 'sample.png',
  originalName: 'original.png',
  noiseMaskName: 'hard.png',
  compositeMaskName: 'soft.png',
  originalWidth: prepared.originalWidth,
  originalHeight: prepared.originalHeight,
  crop: prepared.crop,
  seed: 4321,
})
assert.equal(workflow.workflow['5']?.class_type, 'VAEEncode')
assert.equal(workflow.workflow['80']?.class_type, 'LoadImageMask')
assert.equal(workflow.workflow['81']?.class_type, 'SetLatentNoiseMask')
assert.deepEqual(workflow.workflow['6']?.inputs?.latent_image, ['81', 0])
assert.deepEqual(workflow.workflow['81']?.inputs?.mask, ['80', 0])
assert.equal(workflow.workflow['83']?.class_type, 'ImageCompositeMasked')
assert.deepEqual(workflow.workflow['83']?.inputs?.destination, ['90', 0])
assert.deepEqual(workflow.workflow['83']?.inputs?.source, ['7', 0])
assert.deepEqual(workflow.workflow['83']?.inputs?.mask, ['82', 0])
assert.equal(workflow.workflow['83']?.inputs?.resize_source, false)
assert.deepEqual(workflow.workflow['8']?.inputs?.images, ['84', 0])
assert.equal(workflow.workflow['84']?.inputs?.width, 101)
assert.equal(workflow.workflow['84']?.inputs?.height, 87)
assert.equal(workflow.workflow['6']?.inputs?.seed, 4321)

const larger = await sharp({
  create: { width: 1024, height: 768, channels: 3, background: '#b4b0a1' },
})
  .png()
  .toBuffer()
const crop = await prepareTargetedEdit({
  imageData: 'data:image/png;base64,' + larger.toString('base64'),
  mode: 'crop',
  contextPx: 100,
  targets: [{ type: 'box', box: [0.5, 0.4, 0.62, 0.55] }],
})
assert.ok(crop.crop.x > 0)
assert.ok(crop.crop.y > 0)
assert.ok(crop.sampleWidth < 1024)
assert.ok(crop.sampleHeight < 768)
assert.equal(crop.sampleWidth % 8, 0)
assert.equal(crop.sampleHeight % 8, 0)
assert.equal(crop.originalWidth, 1024)
assert.equal(crop.originalHeight, 768)
const cropWorkflow = buildSdxlRegionWorkflow({
  prompt: 'fix local detail',
  checkpoint: 'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors',
  sourceName: 'crop.png',
  originalName: 'original.png',
  noiseMaskName: 'hard.png',
  compositeMaskName: 'soft.png',
  originalWidth: crop.originalWidth,
  originalHeight: crop.originalHeight,
  crop: crop.crop,
})
assert.equal(cropWorkflow.workflow['83']?.inputs?.x, crop.crop.x)
assert.equal(cropWorkflow.workflow['83']?.inputs?.y, crop.crop.y)
assert.equal(cropWorkflow.workflow['6']?.inputs?.steps, 8)
assert.equal(cropWorkflow.workflow['6']?.inputs?.cfg, 2)
assert.equal(cropWorkflow.workflow['6']?.inputs?.sampler_name, 'dpmpp_sde')
assert.equal(cropWorkflow.workflow['6']?.inputs?.scheduler, 'karras')

const maskedVae = buildSdxlRegionWorkflow({
  prompt: 'one separately articulated third arm',
  checkpoint: 'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors',
  sourceName: 'sample.png',
  originalName: 'original.png',
  noiseMaskName: 'hard.png',
  compositeMaskName: 'soft.png',
  inpaintEncoding: 'masked-vae',
  originalWidth: prepared.originalWidth,
  originalHeight: prepared.originalHeight,
  crop: prepared.crop,
  denoise: 0.72,
  seed: 932821,
})
assert.equal(maskedVae.workflow['5']?.class_type, 'VAEEncodeForInpaint')
assert.deepEqual(maskedVae.workflow['5']?.inputs?.pixels, ['4', 0])
assert.deepEqual(maskedVae.workflow['5']?.inputs?.vae, ['1', 2])
assert.deepEqual(maskedVae.workflow['5']?.inputs?.mask, ['80', 0])
assert.equal(maskedVae.workflow['5']?.inputs?.grow_mask_by, 0)
assert.deepEqual(maskedVae.workflow['6']?.inputs?.latent_image, ['81', 0])
assert.deepEqual(maskedVae.workflow['8']?.inputs?.images, ['84', 0])
assert.deepEqual(maskedVae.workflow['83']?.inputs?.mask, ['82', 0])

const badRequests: Array<Partial<TargetedEditRequest>> = [
  { ...request, targets: [] },
  { ...request, targets: [{ type: 'box', box: [0.4, 0.3, 0.1, 0.7] }] },
  { ...request, targets: [{ type: 'box', box: [-0.1, 0.3, 0.2, 0.7] }] },
  {
    ...request,
    targets: [
      {
        type: 'polygon',
        points: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
      },
    ],
  },
  { ...request, bleedPx: 120 },
  { ...request, mode: 'crop', featherPx: 100 },
  { ...request, imageData: 'not image data' },
]
for (const bad of badRequests) {
  await assert.rejects(prepareTargetedEdit(bad as TargetedEditRequest))
}

const api = readFileSync('server/api/art/inpaint-targets.post.ts', 'utf8')
assert.ok(api.includes("requireScopedApiUser(event, 'generation:art')"))
assert.ok(api.includes('isPublic: false'))
assert.ok(api.includes('serializeArtJobPayload(payload)'))
assert.ok(api.includes('body.previewOnly === true'))
assert.ok(api.includes("inpaintEncoding !== 'masked-vae'"))
assert.ok(api.includes('inpaintEncoding,'))
assert.ok(api.includes('attemptFingerprint: fingerprint'))
assert.ok(api.includes('await gate.commit('))
console.log(
  'Targeted SDXL inpaint: masks, bleed lock, crop, graph and API validated.',
)
