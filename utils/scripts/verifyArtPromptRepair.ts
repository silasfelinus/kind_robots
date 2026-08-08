import assert from 'node:assert/strict'
import {
  assessArtPrompt,
  extractReferencedArtImageId,
  isGenericArtLabel,
} from '../../server/utils/artPromptQuality'
import {
  DEFAULT_ASSET_ART_STYLE,
  DEFAULT_CAST_ART_DIRECTION,
  normalizeKindRobotsImagePath,
  normalizeQueuedArtJobPayload,
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
assert.equal(assessArtPrompt('robot').useful, true)
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

const repaired = applyArtJobOverrides(structuredClone(payload), {
  promptString: strongPrompt,
})
const workflow = repaired.workflow as Record<string, WorkflowNode>

assert.equal(workflow.positive?.inputs.text, strongPrompt)
assert.equal(workflow.negative?.inputs.text, 'blurry, text')

console.log('Art prompt quality, canonical path, and workflow repair checks passed.')
