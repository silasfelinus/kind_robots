import assert from 'node:assert/strict'
import {
  assessArtPrompt,
  extractReferencedArtImageId,
  isGenericArtLabel,
} from '../../server/utils/artPromptQuality'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'

type WorkflowNode = {
  inputs: Record<string, unknown>
}

const weakPrompt =
  'polished web illustration for Image 529, clear subject, cohesive Kind Robots visual style, no text'
const strongPrompt =
  'A weathered red panda museum visitor leans over a glowing kinetic sculpture, curious expression, layered gallery depth, crisp modern western animation linework, saturated teal and amber light, no readable text'

assert.equal(assessArtPrompt(weakPrompt).useful, false)
assert.equal(extractReferencedArtImageId(weakPrompt), 529)
assert.equal(isGenericArtLabel('Image 529'), true)
assert.equal(isGenericArtLabel('Music Mentor'), false)
assert.equal(assessArtPrompt(strongPrompt).useful, true)

const payload = {
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

const repaired = applyArtJobOverrides(structuredClone(payload), {
  promptString: strongPrompt,
})
const workflow = repaired.workflow as Record<string, WorkflowNode>

assert.equal(workflow.positive?.inputs.text, strongPrompt)
assert.equal(workflow.negative?.inputs.text, 'blurry, text')

console.log('Art prompt quality and workflow repair checks passed.')
