import assert from 'node:assert/strict'
import {
  assessArtPrompt,
  extractReferencedArtImageId,
  isGenericArtLabel,
} from '../../server/utils/artPromptQuality'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  DEFAULT_ASSET_ART_STYLE,
  DEFAULT_CAST_ART_DIRECTION,
  normalizeKindRobotsImagePath,
  normalizeQueuedArtJobPayload,
  repairLegacyArtPrompt,
} from '../../server/utils/artJobNormalization'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'

type WorkflowNode = {
  inputs: Record<string, unknown>
}

const weakPrompt =
  'polished web illustration for Image 529, clear subject, cohesive Kind Robots visual style, no text'
const strongPrompt =
  'A weathered red panda museum visitor leans over a glowing kinetic sculpture, curious expression, layered gallery depth, crisp mature western animation linework, saturated teal and amber light, no readable text'
const concisePrompt = 'Clockwork fox guards neon greenhouse'

assert.equal(assessArtPrompt(weakPrompt).useful, false)
assert.equal(extractReferencedArtImageId(weakPrompt), 529)
assert.equal(isGenericArtLabel('Image 529'), true)
assert.equal(isGenericArtLabel('Music Mentor'), false)
assert.equal(assessArtPrompt(strongPrompt).useful, true)
assert.equal(assessArtPrompt(concisePrompt).useful, true)
assert.equal(assessArtPrompt('red dog').useful, true)
assert.equal(assessArtPrompt('Image 529').reasons[0], 'generic-label')
assert.equal(
  assessArtPrompt('Friendly Kind Robots visual language, portrait').reasons[0],
  'vague-brand-style',
)

assert.equal(
  normalizeKindRobotsImagePath('public/rewards/item/lucky-penny.webp'),
  'public/images/rewards/item/lucky-penny.webp',
)
assert.equal(
  normalizeKindRobotsImagePath('/images/characters/grandmother-whalehall.webp'),
  'public/images/characters/grandmother-whalehall.webp',
)
assert.throws(
  () => normalizeKindRobotsImagePath('public/rewards/../secret.webp'),
  /Unsafe Kind Robots imagePath/,
)

const payload = {
  targetRepo: 'silasfelinus/kind_robots',
  imagePath: 'public/rewards/item/identity-mask.webp',
  promptString: weakPrompt,
  negativePrompt: 'blurry, text',
  workflow: {
    positive: {
      class_type: 'CLIPTextEncode',
      inputs: { text: weakPrompt },
      _meta: { title: 'Positive Prompt' },
    },
    negative: {
      class_type: 'CLIPTextEncode',
      inputs: { text: 'blurry, text' },
      _meta: { title: 'Negative Prompt' },
    },
  },
}

const normalization = normalizeQueuedArtJobPayload(payload)
const normalizedWorkflow = normalization.payload.workflow as Record<
  string,
  WorkflowNode
>
const defaultDirectionLead = DEFAULT_ASSET_ART_STYLE.split(';').at(0) ?? ''

assert.equal(normalization.imagePathChanged, true)
assert.equal(normalization.promptChanged, true)
assert.equal(
  normalization.payload.imagePath,
  'public/images/rewards/item/identity-mask.webp',
)
assert.match(String(normalization.payload.promptString), /multidimensional worldbuilding/)
assert.doesNotMatch(String(normalization.payload.promptString), /Kind Robots visual/i)
assert.equal(
  normalizedWorkflow.positive?.inputs.text,
  normalization.payload.promptString,
)
assert.match(
  String(normalization.payload.promptString),
  new RegExp(defaultDirectionLead),
)

// The phrase substitution must never inject a casting instruction. It runs over
// arbitrary prompts with no idea whether the subject is a person or a ladle, and
// Krea 2 paints that clause literally. See artJobNormalization.ts.
assert.doesNotMatch(
  String(normalization.payload.promptString),
  /cast the people who appear naturally/i,
)
assert.ok(!String(normalization.payload.promptString).includes(DEFAULT_CAST_ART_DIRECTION))

// The eleven FAILED jobs found on 2026-09-07 are old rows created before the
// prompt contract. Their producers were fixed on 2026-08-08, but requeue used
// to replay their payload verbatim, so the newer claim-time gate rejected them
// forever. Repair those exact historical phrases, including workflow copies.
const oldHouseDirection =
  'detailed mature western animation with multidimensional worldbuilding, expressive anatomy and faces, confident ink-like linework, dimensional shapes, rich controlled color, cinematic lighting, tactile environments, and clear readable silhouettes; cast characters naturally across many species, ages, body sizes, body shapes, gender presentations, and levels of conventional attractiveness; include robots only when the subject or scene explicitly calls for them'
const legacyTreasure =
  `iconic treasure-card illustration of Tidefortune Ladle, ${oldHouseDirection}, 2:3 portrait card composition`
const legacyAbility =
  'rare-tier ability card illustration of Ghost-Ring Reading, 2:3 portrait card composition, moonlit silver rings'

for (const [legacy, expected] of [
  [legacyTreasure, /object illustration/i],
  [legacyAbility, /concept illustration/i],
] as const) {
  const repairedLegacy = repairLegacyArtPrompt(legacy)
  assert.match(repairedLegacy, expected)
  assert.match(repairedLegacy, /vertical 2:3 portrait composition/i)
  assert.doesNotMatch(repairedLegacy, /card composition/i)
  assert.doesNotMatch(repairedLegacy, /only when|when the subject/i)
  assert.deepEqual(
    checkArtPromptContract({ prompt: repairedLegacy, engine: 'comfy', cfg: 7 }),
    [],
    'a repaired historical prompt must clear the prompt contract',
  )
}

assert.match(repairLegacyArtPrompt(legacyTreasure), /multidimensional worldbuilding/i)
assert.doesNotMatch(repairLegacyArtPrompt(legacyTreasure), /cast characters naturally/i)

const legacyPayload = {
  targetRepo: 'silasfelinus/kind_robots',
  imagePath: 'public/images/rewards/item/tidefortune-ladle.webp',
  promptString: legacyTreasure,
  workflow: {
    positive: {
      class_type: 'CLIPTextEncode',
      inputs: { text: legacyTreasure },
    },
  },
}
const repairedPayload = normalizeQueuedArtJobPayload(legacyPayload)
const repairedWorkflow = repairedPayload.payload.workflow as Record<string, WorkflowNode>
assert.equal(repairedPayload.promptChanged, true)
assert.equal(
  repairedWorkflow.positive?.inputs.text,
  repairedPayload.payload.promptString,
  'legacy repair must keep top-level and baked workflow prompt copies in sync',
)

const repaired = applyArtJobOverrides(structuredClone(payload), {
  promptString: strongPrompt,
})
const workflow = repaired.workflow as Record<string, WorkflowNode>

assert.equal(workflow.positive?.inputs.text, strongPrompt)
assert.equal(workflow.negative?.inputs.text, 'blurry, text')

console.log('Art prompt quality, canonical path, and workflow repair checks passed.')
