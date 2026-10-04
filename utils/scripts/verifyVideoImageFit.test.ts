// /utils/scripts/verifyVideoImageFit.test.ts
//
// Contract test for music-video/t-026 (server/api/comfy/utils/videoImageFit.ts).
//
// What it protects: every video job that does not ask for a fit renders
// exactly as before (LTX resizes with crop disabled, WAN takes the raw image),
// so Scene Animator and the Video Generator are unchanged. "crop" makes LTX
// crop from the centre on both frames, and gives WAN a centre-cropping
// ImageScale in front of every consumer of the start and end images.
import assert from 'node:assert/strict'

import { buildLtxImageToVideoWorkflow } from '../../server/api/comfy/ltx/utils/imageToVideoWorkflow'
import { buildWanImageToVideoWorkflow } from '../../server/api/comfy/wan/utils/imageToVideoWorkflow'
import {
  applyVideoImageFit,
  normalizeVideoImageFit,
} from '../../server/api/comfy/utils/videoImageFit'

type Graph = Record<
  string,
  { class_type?: string; inputs?: Record<string, unknown> }
>

const size = { width: 1280, height: 720 }

function ltx(lastImageName: string | null) {
  return buildLtxImageToVideoWorkflow({
    prompt: 'a koala walks into the wind',
    negativePrompt: '',
    firstImageName: 'first.png',
    lastImageName,
    width: size.width,
    height: size.height,
    duration: 4,
    frameRate: 16,
    seed: 1,
  }) as unknown as Graph
}

function wan(lastImageName: string | null) {
  return buildWanImageToVideoWorkflow({
    prompt: 'a koala walks into the wind',
    negativePrompt: '',
    firstImageName: 'first.png',
    lastImageName,
    width: 832,
    height: 480,
    duration: 3,
    frameRate: 16,
    seed: 1,
  }) as unknown as Graph
}

function refsTo(graph: Graph, nodeId: string): string[] {
  const found: string[] = []
  for (const [id, node] of Object.entries(graph)) {
    for (const value of Object.values(node.inputs ?? {})) {
      if (Array.isArray(value) && value[0] === nodeId) found.push(id)
    }
  }
  return found
}

{
  assert.equal(normalizeVideoImageFit(undefined), 'stretch')
  assert.equal(normalizeVideoImageFit('cover'), 'stretch')
  assert.equal(normalizeVideoImageFit('crop'), 'crop')

  const before = ltx('last.png')
  const after = applyVideoImageFit(ltx('last.png'), 'ltx', 'stretch', size)
  assert.deepEqual(after, before, 'stretch leaves an LTX graph untouched')
  assert.equal(after.img_scale?.inputs?.crop, 'disabled')
  assert.equal(after.img_last_scale?.inputs?.crop, 'disabled')

  for (const last of ['last.png', null]) {
    const wanBefore = wan(last)
    assert.deepEqual(
      applyVideoImageFit(wan(last), 'wan', 'stretch', size),
      wanBefore,
      'stretch leaves a WAN graph untouched',
    )
  }
}
console.log('✅ without a fit, LTX and WAN graphs are exactly what they were')

{
  const graph = applyVideoImageFit(ltx('last.png'), 'ltx', 'crop', size)
  assert.equal(graph.img_scale?.inputs?.crop, 'center')
  assert.equal(graph.img_last_scale?.inputs?.crop, 'center')
  const firstOnly = applyVideoImageFit(ltx(null), 'ltx', 'crop', size)
  assert.equal(firstOnly.img_scale?.inputs?.crop, 'center')
  assert.equal(firstOnly.img_last_scale, undefined)
}
console.log('✅ crop makes LTX scale to cover and trim from the centre')

{
  const plain = wan('last.png')
  const consumersFirst = refsTo(plain, 'img_first')
  const consumersLast = refsTo(plain, 'img_last')
  assert.ok(consumersFirst.length && consumersLast.length)

  const graph = applyVideoImageFit(wan('last.png'), 'wan', 'crop', {
    width: 832,
    height: 480,
  })
  assert.deepEqual(refsTo(graph, 'img_first'), ['img_first_fit'])
  assert.deepEqual(refsTo(graph, 'img_last'), ['img_last_fit'])
  assert.deepEqual(refsTo(graph, 'img_first_fit').sort(), consumersFirst.sort())
  assert.deepEqual(refsTo(graph, 'img_last_fit').sort(), consumersLast.sort())
  assert.deepEqual(graph.img_first_fit?.inputs, {
    image: ['img_first', 0],
    upscale_method: 'lanczos',
    width: 832,
    height: 480,
    crop: 'center',
  })

  const firstOnly = applyVideoImageFit(wan(null), 'wan', 'crop', size)
  assert.ok(firstOnly.img_first_fit)
  assert.equal(firstOnly.img_last_fit, undefined)
}
console.log(
  '✅ crop gives WAN a centre-cropping resize in front of every frame consumer',
)
