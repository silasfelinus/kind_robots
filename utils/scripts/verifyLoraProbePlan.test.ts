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
  assert.equal(
    selectProbeCheckpoint('pony', true, ponyPool)?.localPath,
    'Pony/ponyFaetality_v11.safetensors',
    'a mature Pony LoRA takes the preferred base, not the alphabetical one',
  )
  assert.equal(
    selectProbeCheckpoint('pony', true, pool)?.id,
    10,
    'with no preferred base present it still falls back deterministically',
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

  console.log('verifyLoraProbePlan: all assertions passed')
}

run()
