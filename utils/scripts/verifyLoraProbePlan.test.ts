// /utils/scripts/verifyLoraProbePlan.test.ts
//
// Self-test for utils/loraProbe.ts -- the pure mapping behind LoRA preview
// probes: which base family a LoRA belongs to, which registered checkpoint it
// renders against, and whether its current preview counts as art at all.
//
// The cases that matter here are the ones the live catalog actually contains
// and a hand-check misses: a Pony LoRA must never fall through to an SDXL-base
// checkpoint (it renders mush rather than failing, so nothing would flag it), a
// checkpoint's own `generation` string lies often enough that the localPath
// directory has to win, an AnimateDiff motion module filed under SD15/ is not a
// checkpoint, and a preview URL on a host whose DNS is gone is not a preview.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildLoraProbePrompt,
  escapeSdPromptWeighting,
  sanitizeProbeTrigger,
  classifyCheckpointFamily,
  classifyLoraFamily,
  hasBlindPreview,
  LORA_PROBE_RECIPES,
  probeTriggerText,
  selectProbeCheckpoint,
  type ProbeCheckpointCandidate,
} from '../loraProbe.js'

function checkpoint(
  id: number,
  localPath: string,
  isMature: boolean,
  generation: string | null = null,
): ProbeCheckpointCandidate {
  return {
    id,
    name: localPath.split('/').pop() || localPath,
    localPath,
    generation,
    isMature,
  }
}

function run(): void {
  // --- classifyLoraFamily ---
  assert.equal(classifyLoraFamily('Pony'), 'pony')
  assert.equal(classifyLoraFamily('SDXL 1.0'), 'sdxl')
  assert.equal(classifyLoraFamily('SD 1.5'), 'sd15')
  assert.equal(classifyLoraFamily('SD 1.5 (from architecture)'), 'sd15')
  assert.equal(classifyLoraFamily('Flux.1 D'), 'flux')
  assert.equal(classifyLoraFamily('Illustrious'), 'illustrious')

  assert.equal(
    classifyLoraFamily('Flux.1 Kontext'),
    'unsupported',
    'Kontext is an edit model: a text-only probe cannot serve it',
  )
  assert.equal(
    classifyLoraFamily('SD 2.1 768'),
    'unsupported',
    'SD 2.1 has no registered base to render against',
  )
  assert.equal(classifyLoraFamily('Wan Video 2.2 I2V-A14B'), 'unsupported')

  // supportedServer is a fallback only, and never upgrades an empty
  // generation into a Pony/Illustrious guess -- those need the real baseModel.
  assert.equal(classifyLoraFamily('', 'SDXL'), 'sdxl')
  assert.equal(classifyLoraFamily(null, 'SD15'), 'sd15')
  assert.equal(classifyLoraFamily('Other', 'SDXL'), 'sdxl')
  assert.equal(classifyLoraFamily('Unknown', null), 'unsupported')

  // --- classifyCheckpointFamily: directory beats generation ---
  assert.equal(
    classifyCheckpointFamily(
      checkpoint(1, 'Pony/cyberrealisticPony_v61.safetensors', true, 'ARCHIVE'),
    ),
    'pony',
    "the live row carries generation 'ARCHIVE'; the Pony/ directory is the truth",
  )
  assert.equal(
    classifyCheckpointFamily(
      checkpoint(
        2,
        'SD15/duchaitenStylelikeme_v15Fp16NoEma.safetensors',
        false,
        'SDXL',
      ),
    ),
    'sd15',
    "the live row is filed under SD15/ but carries generation 'SDXL'",
  )
  assert.equal(
    classifyCheckpointFamily(
      checkpoint(3, 'SDXL/cartoonArcadiaSDXLSD1_v2.safetensors', true, 'base'),
    ),
    'sdxl',
  )
  assert.equal(
    classifyCheckpointFamily(
      checkpoint(
        4,
        'Unknown/darkSushiMixMix_colorful.safetensors',
        true,
        '1.5',
      ),
    ),
    'sd15',
    'an unhelpfully filed row falls back to its generation string',
  )
  assert.equal(
    classifyCheckpointFamily(
      checkpoint(5, 'SD15/v3_sd15_mm.ckpt', false, 'SD 1.5'),
    ),
    'unsupported',
    'an AnimateDiff motion module is not a text-to-image checkpoint',
  )

  // --- selectProbeCheckpoint ---
  const pool = [
    checkpoint(10, 'Pony/cyberrealisticPony_v61.safetensors', true, 'ARCHIVE'),
    checkpoint(11, 'Pony/realcartoonPony_v1.safetensors', false),
    checkpoint(12, 'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors', false),
    checkpoint(13, 'SDXL/lustifySDXLNSFW_oltFIXEDTEXTURES.safetensors', true),
    checkpoint(14, 'SD15/v3_sd15_mm.ckpt', false, 'SD 1.5'),
  ]

  assert.equal(
    selectProbeCheckpoint('pony', false, pool)?.id,
    11,
    'an SFW Pony LoRA prefers the SFW Pony base',
  )
  /*
   * NOT alphabetical. cyberrealisticPony sorts first and is what the original
   * tie-break chose for 61 of the first batch's 205 renders -- and it is a
   * photorealistic merge, which rendered a style LoRA as a studio photograph
   * of a toy. PROBE_BASE_PREFERENCE exists to keep that from being decided by
   * sort order.
   */
  const ponyPool = [
    ...pool,
    checkpoint(15, 'Pony/ponyFaetality_v11.safetensors', true, 'Pony'),
  ]
  /*
   * ponyFaetality must never be selected, however well it sorts or matches on
   * maturity. It wedged the relay: ArtJob 22838 was claimed three times, hung
   * on the model load every time, and ended FAILED at attempts 3 with
   * errorMessage null -- a hang, not a rejection, the same signature as the
   * Flux.2 Klein checkpoint in conductor/t-165.
   */
  for (const isMature of [true, false]) {
    const chosen = selectProbeCheckpoint('pony', isMature, ponyPool)?.localPath
    assert.ok(
      chosen && !chosen.includes('ponyFaetality'),
      `ponyFaetality must never be chosen (isMature=${isMature}, got ${chosen})`,
    )
  }
  assert.equal(
    selectProbeCheckpoint('pony', false, ponyPool)?.localPath,
    'Pony/realcartoonPony_v1.safetensors',
    'an SFW Pony LoRA takes realcartoonPony, which lets a style LoRA through',
  )
  /*
   * Pony ignores the maturity match entirely (Silas, 2026-09-15, after
   * reviewing the first 133 renders: realcartoonPony is "a great default ...
   * highly consistent"). Without this a mature Pony LoRA fell back to the
   * photorealistic cyberrealisticPony and got the studio-photo framing the
   * probe exists to avoid. An SFW-flagged base does not suppress a mature
   * LoRA -- the flag describes the checkpoint's training, not a render filter.
   */
  assert.equal(
    selectProbeCheckpoint('pony', true, ponyPool)?.localPath,
    'Pony/realcartoonPony_v1.safetensors',
    'a mature Pony LoRA still takes realcartoonPony',
  )
  /*
   * ...but the override is Pony-only. Every other family still prefers a base
   * whose maturity matches the LoRA's.
   */
  const sdxlPool = [
    checkpoint(30, 'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors', false),
    checkpoint(31, 'SDXL/duskMixXLIllustration_v15.safetensors', true),
  ]
  assert.equal(
    selectProbeCheckpoint('sdxl', true, sdxlPool)?.localPath,
    'SDXL/duskMixXLIllustration_v15.safetensors',
    'sdxl still respects the maturity match',
  )
  assert.equal(
    selectProbeCheckpoint('sdxl', false, sdxlPool)?.localPath,
    'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors',
  )
  /*
   * With NO name from the preference list in the pool at all, selection still
   * falls back to the deterministic alphabetical order rather than returning
   * nothing. (`pool` above does contain realcartoonPony, so it cannot test
   * this -- that was the bug in an earlier version of this assertion.)
   */
  const unlistedPony = [
    checkpoint(40, 'Pony/zzzUnknownPony_v1.safetensors', true, 'Pony'),
    checkpoint(41, 'Pony/aaaUnknownPony_v1.safetensors', true, 'Pony'),
  ]
  assert.equal(
    selectProbeCheckpoint('pony', true, unlistedPony)?.id,
    41,
    'no preferred base present falls back to alphabetical order',
  )
  assert.equal(
    selectProbeCheckpoint('sdxl', true, pool)?.id,
    13,
    'family match is resolved within SDXL, not across into Pony',
  )
  assert.equal(
    selectProbeCheckpoint('sd15', false, pool),
    null,
    'the only SD15-filed row is a motion module, so nothing is selectable',
  )
  assert.equal(
    selectProbeCheckpoint('illustrious', false, pool),
    null,
    'a family with no registered base returns null rather than a near-miss',
  )
  assert.equal(selectProbeCheckpoint('unsupported', false, pool), null)

  /*
   * Flux resolves its own UNet through fluxModelByVariant and never reads
   * `checkpoint`, so selecting one would record a base on the ArtImage that
   * took no part in the render -- and would route Flux.1 D LoRAs onto
   * Flux.2 Klein rows that happen to sit in the same Flux/ directory.
   */
  const fluxPool = [
    checkpoint(
      30,
      'Flux/bigLove_klein2_fp8_pruned.safetensors',
      true,
      'Flux.2 Klein 9B',
    ),
    checkpoint(31, 'Flux/FluxedUp_v4.1.safetensors', true, 'Flux.1 D'),
  ]
  assert.equal(
    selectProbeCheckpoint('flux', true, fluxPool),
    null,
    'the flux lane supplies its own base and picks nothing from the catalog',
  )
  assert.equal(
    LORA_PROBE_RECIPES.flux.basePolicy,
    'engine-default',
    'flux must stay on the engine-default policy for that null to mean "lane-fixed"',
  )
  for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
    assert.equal(
      LORA_PROBE_RECIPES[family].basePolicy,
      'catalog-checkpoint',
      `${family} renders against a registered checkpoint`,
    )
  }

  // Maturity is a preference, never a filter: a mature LoRA in a family whose
  // only base is SFW still renders rather than being skipped.
  const sfwOnly = [
    checkpoint(20, 'Illustrious/illustrij_v21.safetensors', false),
  ]
  assert.equal(
    selectProbeCheckpoint('illustrious', true, sfwOnly)?.id,
    20,
    'family match outranks maturity match',
  )

  // Selection is deterministic, so a re-plan queues the same base as before.
  assert.equal(
    selectProbeCheckpoint('sdxl', false, [...pool].reverse())?.id,
    selectProbeCheckpoint('sdxl', false, pool)?.id,
    'checkpoint choice does not depend on row order',
  )

  // --- buildLoraProbePrompt ---
  const pony = buildLoraProbePrompt('pony', 'EPpkJessie, long hair')
  assert.ok(pony)

  /*
   * No medium anywhere in any scaffold. 'soft even lighting, sharp focus,
   * plain neutral background' is a product-photography recipe, and on a
   * photorealistic base it rendered an Adventure Time STYLE LoRA as a studio
   * photo of a vinyl toy (ArtImage 24472). A probe may fix the subject and the
   * framing; the medium is the thing being measured.
   */
  const MEDIUM_WORDS = [
    'lighting',
    'sharp focus',
    'photo',
    'photograph',
    'render',
    'studio',
    'lens',
    'bokeh',
    'depth of field',
    'illustration',
  ]
  for (const [family, recipe] of Object.entries(LORA_PROBE_RECIPES)) {
    const probe = recipe.positive('TRIGGER').toLowerCase()
    for (const word of MEDIUM_WORDS) {
      assert.ok(
        !probe.includes(word),
        `${family} scaffold must not name a medium (found ${word}): ${probe}`,
      )
    }
  }
  assert.ok(
    pony.prompt.startsWith('score_9, score_8_up, score_7_up'),
    'Pony needs its score scaffold ahead of the trigger',
  )
  assert.ok(pony.prompt.includes('EPpkJessie, long hair'))
  assert.ok(pony.negativePrompt.includes('score_6'))

  const flux = buildLoraProbePrompt('flux', 'the calmstyle style')
  assert.ok(flux)
  assert.equal(flux.negativePrompt, '', 'Flux takes no negative prompt')
  assert.ok(flux.prompt.includes('the calmstyle style'))

  // --- sanitizeProbeTrigger ---
  /*
   * defaultTrigger is not reliably a prompt. Across the catalog it holds real
   * tag lists, A1111 invocation syntax, and -- for rows with no trigger at all
   * -- the LoRA's own title. Silas flagged the last of these on 2026-09-15:
   * resource 1123's trigger is the literal string 'FLUX2.D Turbo 8-Step Lora
   * for ComfyUI', which asks the model to depict its own filename.
   */
  assert.equal(
    sanitizeProbeTrigger(
      '<lora:foo-illustriousxl-lora:1>, after fellatio, looking at viewer',
    ),
    'after fellatio, looking at viewer',
    'A1111 invocation syntax renders as literal text in ComfyUI and must go',
  )
  assert.equal(
    sanitizeProbeTrigger('Grey Impact - Illustrious/PonyXL'),
    'Grey Impact',
  )
  assert.equal(
    sanitizeProbeTrigger('Invincible Comic for PonyXL'),
    'Invincible Comic',
  )
  assert.equal(
    sanitizeProbeTrigger('adventure time, dot eyes'),
    'adventure time, dot eyes',
    'a real tag list is left completely alone',
  )
  assert.equal(
    sanitizeProbeTrigger('score_9, 1girl, (pink skin:1.1), smile'),
    'score_9, 1girl, (pink skin:1.1), smile',
    'authored (tag:weight) syntax survives sanitizing',
  )
  assert.ok(
    !sanitizeProbeTrigger('FLUX2.D Turbo 8-Step Lora for ComfyUI')
      .toLowerCase()
      .includes('comfyui'),
    'packaging words never reach the prompt',
  )

  const longTrigger = Array.from({ length: 60 }, (_, i) => `tag${i}`).join(', ')
  const clipped = sanitizeProbeTrigger(longTrigger)
  assert.ok(clipped.length <= 240, 'a tag soup is capped')
  assert.ok(!clipped.endsWith(','), 'the cap lands on a tag boundary')

  /*
   * Weighting metacharacters in a trigger must not silently re-weight the
   * probe. '(Imminent) Reversed Gangbang (Concept)' is a real defaultTrigger in
   * the catalog, and raw parens would emphasise parts of it at render time.
   */
  assert.equal(
    escapeSdPromptWeighting('(Imminent) Reversed [Concept]'),
    String.raw`\(Imminent\) Reversed \[Concept\]`,
  )
  assert.equal(escapeSdPromptWeighting('plain trigger'), 'plain trigger')

  const weighted = buildLoraProbePrompt('sdxl', '(Imminent) Concept')
  assert.ok(weighted)
  assert.ok(
    weighted.prompt.includes(String.raw`\(Imminent\)`),
    'SD lanes escape weighting syntax in the trigger',
  )

  const fluxWeighted = buildLoraProbePrompt('flux', '(Imminent) Concept')
  assert.ok(fluxWeighted)
  assert.ok(
    fluxWeighted.prompt.includes('(Imminent) Concept'),
    'Flux reads prose through T5 and must not be escaped',
  )

  const emptyTrigger = buildLoraProbePrompt('sdxl', '')
  assert.ok(emptyTrigger)
  assert.ok(
    !emptyTrigger.prompt.startsWith(','),
    'a LoRA with no trigger still yields a clean prompt',
  )

  assert.equal(buildLoraProbePrompt('unsupported', 'x'), null)

  // SD 1.5 renders below 1024: at 1024 it duplicates subjects, which would
  // read as a bad LoRA in the grid when it is really a bad resolution.
  assert.ok(
    LORA_PROBE_RECIPES.sd15.width < LORA_PROBE_RECIPES.sdxl.width,
    'SD 1.5 probes render smaller than SDXL probes',
  )

  // Steps and cfg are intentionally absent so sdxlSamplerProfile() can tune
  // distilled/turbo checkpoints; a hardcoded step count would mis-render them.
  for (const [family, recipe] of Object.entries(LORA_PROBE_RECIPES)) {
    assert.ok(
      !('steps' in recipe) && !('cfg' in recipe),
      `${family} must not pin sampler steps/cfg`,
    )
  }

  // --- probeTriggerText ---
  assert.equal(
    probeTriggerText({ defaultTrigger: 'calmstyle', triggerWords: 'other' }),
    'calmstyle',
    'defaultTrigger wins when both are present',
  )
  assert.equal(
    probeTriggerText({ defaultTrigger: '  ', triggerWords: 'fallback' }),
    'fallback',
  )
  assert.equal(probeTriggerText({}), '')

  // --- hasBlindPreview ---
  assert.equal(
    hasBlindPreview({
      previewImageUrl: 'https://image.civitai.com/abc/1.jpeg',
    }),
    false,
    'a live civitai hotlink is still a preview',
  )
  assert.equal(
    hasBlindPreview({
      previewImageUrl: 'https://img.genur.art/sig/width:450/abc',
    }),
    true,
    'img.genur.art has no DNS record, so its URLs are not previews',
  )
  assert.equal(hasBlindPreview({}), true, 'no fields at all is blind')
  assert.equal(hasBlindPreview({ previewImageUrl: '   ' }), true)
  assert.equal(
    hasBlindPreview({ artImageId: 42, previewImageUrl: null }),
    false,
    'a generated ArtImage is the strongest preview signal',
  )
  assert.equal(
    hasBlindPreview({
      imagePath: '/api/art/images/7/file',
      previewImageUrl: null,
    }),
    false,
  )
  /*
   * The triage page loads /api/resources, whose resourceListSelect carries the
   * nested ArtImage but NO artImageId column -- so a check that only read
   * artImageId would report every already-rendered LoRA as still blind on the
   * one screen this count exists for.
   */
  assert.equal(
    hasBlindPreview({ ArtImage: { id: 9 }, previewImageUrl: null }),
    false,
    'a nested ArtImage counts even when artImageId is not selected',
  )
  assert.equal(
    hasBlindPreview({ ArtImage: null, previewImageUrl: null }),
    true,
    'an explicitly null ArtImage is still blind',
  )

  /*
   * EntityArtType registry drift.
   *
   * Adding 'resource' to the union and to ENTITY_FIELDS is not enough: the
   * runtime gate is normalizeEntityArtType's hardcoded literal list, and a type
   * missing from it is rejected with a 400 at enqueue while the compiler stays
   * perfectly happy, because the function's return type still narrows. That is
   * exactly how this shipped broken the first time. Compare the two lists as
   * source text so the next entity type added cannot repeat it.
   */
  const entityArtSource = readFileSync(
    resolve(process.cwd(), 'server/utils/entityArt.ts'),
    'utf8',
  )

  const unionBlock = entityArtSource.match(
    /export type EntityArtType =([\s\S]*?)\n\nexport type EntityArtMode/,
  )
  assert.ok(unionBlock?.[1], 'EntityArtType union could not be located')
  const unionTypes = [...unionBlock[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1])
  assert.ok(unionTypes.includes('resource'), 'resource is in the union')

  const normalizeBlock = entityArtSource.match(
    /export function normalizeEntityArtType[\s\S]*?\n}/,
  )
  assert.ok(normalizeBlock?.[0], 'normalizeEntityArtType could not be located')
  const acceptedTypes = [
    ...normalizeBlock[0].matchAll(/type === '([a-z]+)'/g),
  ].map((m) => m[1])

  assert.deepEqual(
    [...unionTypes].sort(),
    [...acceptedTypes].sort(),
    'every EntityArtType must be accepted by normalizeEntityArtType at runtime',
  )

  const fieldsBlock = entityArtSource.match(
    /export const ENTITY_FIELDS[\s\S]*?\n}\n/,
  )
  assert.ok(fieldsBlock?.[0], 'ENTITY_FIELDS could not be located')
  for (const entityType of unionTypes) {
    assert.ok(
      fieldsBlock[0].includes(`\n  ${entityType}: {`),
      `${entityType} needs an ENTITY_FIELDS entry`,
    )
  }

  /*
   * Flux.2 must never reach the flux lane. ArtJob 22837 applied a Flux.2 Turbo
   * LoRA through the Flux.1 dev UNet on 2026-09-15 and hung ComfyUI for 90+
   * minutes, wedging the relay's single slot and stopping the whole render
   * queue until it was restarted by hand. kind_robots#2435 blocks the mirror
   * case (Flux.1 LoRA into the Flux.2 lane) but is directional.
   */
  for (const generation of ['Flux.2 D', 'Flux.2 Klein 9B', 'flux2', 'Klein']) {
    assert.equal(
      classifyLoraFamily(generation),
      'unsupported',
      `${generation} must not be routed onto the Flux.1 dev UNet`,
    )
  }
  for (const generation of ['Flux.1 D', 'Flux (from metadata)', 'FLUX']) {
    assert.equal(
      classifyLoraFamily(generation),
      'flux',
      `${generation} is genuinely Flux.1 and still renders`,
    )
  }

  /*
   * Z-Image is its own lane, not an SD checkpoint. ArtJob 25378 proved the
   * ordinary comfy graph cannot run it: CheckpointLoaderSimple loaded the
   * weights and CLIPTextEncode then failed with "clip input is invalid: None",
   * because Z-Image ships its text encoder (Qwen3-4B) separately.
   */
  for (const generation of ['ZImageTurbo', 'ZImageBase', 'z-image turbo']) {
    assert.equal(
      classifyLoraFamily(generation),
      'zimage',
      `${generation} routes to the zimage lane`,
    )
  }
  assert.equal(LORA_PROBE_RECIPES.zimage.engine, 'zimage')
  assert.equal(
    LORA_PROBE_RECIPES.zimage.basePolicy,
    'engine-default',
    'the zimage lane loads fixed weights, so it picks no catalog checkpoint',
  )
  assert.equal(
    selectProbeCheckpoint('zimage', true, [
      checkpoint(
        50,
        'ZImage/zImageTurboNSFW_82_FP8.safetensors',
        true,
        'ZImageTurbo',
      ),
    ]),
    null,
    'a ZImage/ checkpoint is never selected -- the lane supplies its own UNet',
  )
  const zimageProbe = buildLoraProbePrompt('zimage', 'RealisticSnapshot')
  assert.ok(zimageProbe)
  assert.equal(
    zimageProbe.negativePrompt,
    '',
    'Z-Image derives its negative by zeroing the positive conditioning',
  )

  console.log('verifyLoraProbePlan: all assertions passed')
}

run()
