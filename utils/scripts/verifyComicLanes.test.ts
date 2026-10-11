// /utils/scripts/verifyComicLanes.test.ts
//
// Contract test for comic-creator/t-013 lanes (utils/comicLanes.ts). Pure functions only.
// What it protects: every default lane is enqueueable as written (engine set, SDXL
// family lanes carry a checkpoint, no quarantined checkpoint), tag lanes compose tags
// while prose lanes compose prose, the negative prompt only reaches the SDXL family
// (Z-Image zeroes it, Krea ignores it at cfg 1), and steps/cfg stay unset so the
// checkpoint family profile in /api/art/enqueue applies.
import assert from 'node:assert/strict'

import { buildDefaultComfyWorkflow } from '../../server/api/comfy/sdxl/utils/workflow'
import { checkpointFamily } from '../checkpointProfiles.js'
import {
  buildComicLaneEnqueueBody,
  COMIC_RENDER_SIZES,
  comicLaneQueueDecision,
  comicPrimaryLane,
  composeComicLanePrompt,
  DEFAULT_COMIC_LANES,
  normalizeComicLanes,
  orderComicLanes,
  parseComicLanes,
  selectComicCastLoras,
} from '../comicLanes.js'

{
  const { lanes, errors } = normalizeComicLanes(DEFAULT_COMIC_LANES)
  assert.deepEqual(errors, [])
  assert.equal(lanes.length, DEFAULT_COMIC_LANES.length)
  for (const lane of lanes) {
    if (lane.engine === 'comfy')
      assert.ok(lane.checkpoint, `${lane.key} needs a checkpoint`)
  }
}
console.log('✅ default lanes normalize cleanly')

{
  const { lanes, errors } = normalizeComicLanes([
    { key: 'a', engine: 'a1111' },
    { key: 'b', engine: 'comfy' },
    {
      key: 'c',
      engine: 'comfy',
      checkpoint: 'Pony/ponyFaetality_v11.safetensors',
    },
    {
      key: 'd',
      engine: 'comfy',
      checkpoint: 'ZImage/zImageTurboNSFW_82_FP8.safetensors',
    },
    { key: 'e', engine: 'zimage' },
    { key: 'e', engine: 'krea2' },
    { key: 'Bad Key', engine: 'krea2' },
  ])
  assert.deepEqual(
    lanes.map((lane) => lane.key),
    ['e'],
  )
  assert.equal(errors.length, 6)
  assert.deepEqual(parseComicLanes('not json'), DEFAULT_COMIC_LANES)
  assert.deepEqual(parseComicLanes('[]'), DEFAULT_COMIC_LANES)
}
console.log(
  '✅ unsupported engines, missing or quarantined checkpoints and duplicates are refused',
)

{
  const tags = DEFAULT_COMIC_LANES.find(
    (lane) => lane.key === 'il-furrytoonmix',
  )!
  const prose = DEFAULT_COMIC_LANES.find((lane) => lane.key === 'zimage-turbo')!
  const slot = {
    promptProse: 'a koala ronin on a dune',
    promptTags: 'anthro, koala',
    negativePrompt: 'nsfw',
  }
  const series = {
    styleProse: 'gritty painted comic',
    styleTags: 'western',
    negativeTags: 'lowres',
  }
  const tagged = composeComicLanePrompt(tags, slot, series)
  assert.ok(tagged.prompt.startsWith('masterpiece'))
  assert.ok(tagged.prompt.includes('western, anthro, koala'))
  assert.equal(tagged.negativePrompt, 'nsfw')
  const prosed = composeComicLanePrompt(prose, slot, series)
  assert.equal(prosed.prompt, 'a koala ronin on a dune, gritty painted comic')
  assert.equal(prosed.negativePrompt, null)
  const fallback = composeComicLanePrompt(
    tags,
    { promptProse: 'only prose' },
    series,
  )
  assert.equal(fallback.usedFallback, true)
  assert.ok(fallback.prompt.includes('only prose'))
  assert.equal(
    composeComicLanePrompt(tags, { promptTags: 'x' }, series).negativePrompt,
    'lowres',
  )
  const plain = composeComicLanePrompt(
    prose,
    { ...slot, useSeriesStyle: false },
    series,
  )
  assert.equal(plain.prompt, 'a koala ronin on a dune')
}
console.log(
  '✅ tag lanes compose tags, prose lanes compose prose, negatives reach only SDXL lanes',
)

{
  const tags = DEFAULT_COMIC_LANES.find((lane) => lane.key === 'il-realism')!
  const body = buildComicLaneEnqueueBody(
    tags,
    { promptTags: 'koala', negativePrompt: 'nsfw', aspect: '16:9' },
    { isPublicArt: false },
  )
  assert.equal(body.engine, 'comfy')
  assert.equal(
    body.checkpoint,
    'Illustrious/realismIllustriousBy_v55FP16.safetensors',
  )
  assert.equal(body.width, 1344)
  assert.equal(body.height, 768)
  assert.equal('steps' in body, false)
  assert.equal('cfg' in body, false)
  assert.equal(body.isPublic, false)
  assert.equal(body.projectSlug, 'comic-creator')
  const zimage = buildComicLaneEnqueueBody(
    DEFAULT_COMIC_LANES.find((lane) => lane.key === 'zimage-turbo')!,
    {
      promptProse: 'x',
      negativePrompt: 'nsfw',
    },
  )
  assert.equal('checkpoint' in zimage, false)
  assert.equal('negativePrompt' in zimage, false)
}
console.log('✅ enqueue bodies leave steps and cfg to the family profile')

{
  for (const [aspect, size] of Object.entries(COMIC_RENDER_SIZES)) {
    assert.equal(size.width % 64, 0, aspect)
    assert.equal(size.height % 64, 0, aspect)
    const megapixels = (size.width * size.height) / 1_000_000
    assert.ok(megapixels > 0.6 && megapixels < 1.1, aspect)
  }
  assert.equal(comicLaneQueueDecision(2).allowed, true)
  assert.equal(comicLaneQueueDecision(3).allowed, false)
}
console.log(
  '✅ render sizes are SDXL-safe and the per-lane queue cap holds at three',
)

{
  const primary = comicPrimaryLane(
    normalizeComicLanes(DEFAULT_COMIC_LANES).lanes,
  )
  assert.equal(
    primary?.checkpoint,
    'Illustrious/arthemyWesternArt_v30.safetensors',
  )
  assert.equal(parseComicLanes(null)[0]?.key, 'il-arthemy')
  assert.equal(
    DEFAULT_COMIC_LANES.find((lane) => lane.key === 'il-furrytoonmix')?.active,
    true,
    'the previous house lane stays available',
  )

  const two = normalizeComicLanes([
    { key: 'a', engine: 'zimage', primary: true, active: false },
    { key: 'b', engine: 'zimage', primary: true },
    {
      key: 'c',
      engine: 'comfy',
      checkpoint: 'Illustrious/x.safetensors',
      primary: true,
    },
  ]).lanes
  assert.deepEqual(
    two.filter((lane) => lane.primary).map((lane) => lane.key),
    ['b'],
    'an inactive lane cannot be primary, and the first marked active lane wins',
  )
  const none = normalizeComicLanes([
    { key: 'z', engine: 'zimage' },
    { key: 'c', engine: 'comfy', checkpoint: 'Illustrious/x.safetensors' },
  ]).lanes
  assert.equal(
    comicPrimaryLane(none)?.key,
    'c',
    'falls back to the first SDXL-family lane',
  )
  assert.deepEqual(
    orderComicLanes(none).map((lane) => lane.key),
    ['c', 'z'],
  )
}
{
  const arthemy = buildComicLaneEnqueueBody(
    DEFAULT_COMIC_LANES.find((item) => item.key === 'il-arthemy')!,
    { promptTags: 'koala' },
  )
  assert.equal(
    arthemy.sampler,
    'euler_ancestral',
    "the house lane runs the author's sampler",
  )
  assert.equal(arthemy.steps, 30)
  assert.equal(arthemy.cfg, 5)
  assert.ok(
    arthemy.promptString.includes('toon (style), western comics (style)'),
    "the house lane carries the author's style tags",
  )
}
console.log('✅ exactly one active lane is primary, and Arthemy is the default')

{
  const [lane] = normalizeComicLanes([
    {
      key: 'nova',
      engine: 'comfy',
      checkpoint: 'Illustrious/novaFurryXL_v180B.safetensors',
      promptStyle: 'tags',
      sampler: 'Euler_Ancestral',
      cfg: 5,
    },
  ]).lanes
  const body = buildComicLaneEnqueueBody(lane!, { promptTags: 'koala' })
  assert.equal(body.sampler, 'euler_ancestral')
  assert.equal('scheduler' in body, false)
  assert.equal(body.cfg, 5)
  const [unknown] = normalizeComicLanes([
    { key: 'z', engine: 'zimage', sampler: 'euler', cfg: 9 },
    {
      key: 'q',
      engine: 'comfy',
      checkpoint: 'Illustrious/x.safetensors',
      sampler: 'warp_drive',
    },
  ]).lanes
  assert.equal(
    unknown?.sampler,
    null,
    'distilled engines keep their own sampler',
  )
  assert.equal(unknown?.cfg, null)
  const defaults = buildComicLaneEnqueueBody(
    DEFAULT_COMIC_LANES.find((item) => item.key === 'il-furrytoonmix')!,
    { promptTags: 'koala' },
  )
  assert.equal(
    'sampler' in defaults,
    false,
    'furrytoonmix keeps the family profile',
  )

  const workflow = buildDefaultComfyWorkflow({
    prompt: 'koala',
    checkpoint: 'Illustrious/furrytoonmix_xlV3.safetensors',
    sampler: 'euler_ancestral',
  }) as Record<
    string,
    { class_type?: string; inputs?: Record<string, unknown> }
  >
  const ksampler = Object.values(workflow).find(
    (node) => node.class_type === 'KSampler',
  )
  assert.equal(ksampler?.inputs?.sampler_name, 'euler_ancestral')
  assert.equal(
    ksampler?.inputs?.scheduler,
    'karras',
    'the family scheduler stays',
  )

  assert.equal(
    checkpointFamily('NoobAI/novaFurryXL_v180B.safetensors'),
    'illustrious',
  )
}
console.log(
  '✅ a lane can carry an author sampler, steps and cfg, and NoobAI gets the Illustrious profile',
)

{
  // Character LoRAs (comic-creator t-016): survive normalization on SDXL-family lanes,
  // ride only when the slot names the character, and share strength when two meet.
  const cast = [
    {
      key: 'zuzu',
      resourceId: 4593,
      trigger: 'zuzukoala',
      match: ['zuzu', 'koala'],
    },
    {
      key: 'coyote',
      resourceId: 4578,
      trigger: 'zkacoyote',
      match: ['coyote'],
      strength: 0.7,
    },
    { key: 'junk', resourceId: -1, match: ['x'] },
  ]
  const arthemy = DEFAULT_COMIC_LANES.find((lane) => lane.key === 'il-arthemy')!
  const krea = DEFAULT_COMIC_LANES.find((lane) => lane.engine === 'krea2')!
  const { lanes, errors } = normalizeComicLanes([
    { ...arthemy, castLoras: cast },
    { ...krea, castLoras: cast },
  ])
  assert.deepEqual(errors, [])
  const withCast = lanes[0]!
  const kreaLane = lanes[1]!
  assert.equal(withCast.castLoras?.length, 2, 'invalid entries are dropped')
  assert.equal(
    kreaLane.castLoras,
    undefined,
    'only SDXL-family lanes keep character LoRAs',
  )

  assert.deepEqual(selectComicCastLoras(withCast, 'a desert road at dusk'), [])
  assert.deepEqual(selectComicCastLoras(withCast, 'Zuzu walks alone'), [
    { resourceId: 4593, strength: 0.8 },
  ])
  assert.deepEqual(
    selectComicCastLoras(withCast, 'koala-sized hat'),
    [{ resourceId: 4593, strength: 0.8 }],
    'a hyphen is a word boundary',
  )
  assert.deepEqual(
    selectComicCastLoras(withCast, 'coyotes'),
    [],
    'whole words only',
  )
  assert.deepEqual(
    selectComicCastLoras(withCast, 'the koala bandages the coyote'),
    [
      { resourceId: 4593, strength: 0.6 },
      { resourceId: 4578, strength: 0.52 },
    ],
  )
  assert.deepEqual(selectComicCastLoras(kreaLane, 'zuzu'), [])

  const solo = normalizeComicLanes([
    {
      ...arthemy,
      castLoras: [
        { ...cast[0], stacks: false },
        cast[1],
        { key: 'sister', resourceId: 4583, match: ['sister'] },
      ],
    },
  ]).lanes[0]!
  assert.equal(solo.castLoras?.[0]?.stacks, false, 'stacks: false survives')
  assert.equal(solo.castLoras?.[1]?.stacks, undefined)
  assert.deepEqual(
    selectComicCastLoras(solo, 'the koala bandages the coyote'),
    [],
    'a non-stacking character in company gets no LoRAs',
  )
  assert.deepEqual(selectComicCastLoras(solo, 'zuzu alone'), [
    { resourceId: 4593, strength: 0.8 },
  ])
  assert.deepEqual(selectComicCastLoras(solo, 'the coyote and the sister'), [
    { resourceId: 4578, strength: 0.52 },
    { resourceId: 4583, strength: 0.6 },
  ])

  const body = buildComicLaneEnqueueBody(
    withCast,
    {
      promptTags: 'anthro koala, standing',
      aspect: 'portrait',
    },
    { styleTags: 'coyote country' },
  )
  assert.deepEqual(
    body.loras,
    [{ resourceId: 4593, strength: 0.8 }],
    'series style never adds a character',
  )
  const plain = buildComicLaneEnqueueBody(withCast, {
    promptTags: 'empty desert',
  })
  assert.equal(plain.loras, undefined)
  const explicit = buildComicLaneEnqueueBody(withCast, {
    promptTags: 'anthro koala',
    castText: 'the coyote alone',
  })
  assert.deepEqual(
    explicit.loras,
    [{ resourceId: 4578, strength: 0.7 }],
    'castText decides who is in it',
  )
}
console.log(
  '✅ character LoRAs ride only on the renders that name their character',
)
