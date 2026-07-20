// /utils/scripts/verifyWonderLabReviewVoiceDiversity.ts
import assert from 'node:assert/strict'
import type { WonderLabComponentSourceEvidence } from '@/utils/wonderlab/componentManifest'
import { buildWonderLabReviewDraftPrompt } from '@/utils/wonderlab/reviewDraftPrompt'
import type {
  WonderLabExhibitProfile,
  WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'

const exhibit: WonderLabExhibitProfile = {
  id: 42,
  componentName: 'bot-builder-panel',
  folderName: 'bots',
  sourcePath: 'components/bots/bot-builder-panel.vue',
  title: 'Bot Builder Panel',
  description: 'A guided interface for assembling a Bot personality and prompt.',
  category: 'builder',
  tags: ['bot', 'builder', 'prompt', 'persona'],
}

const sourceEvidence: WonderLabComponentSourceEvidence = {
  version: 1,
  lineCount: 280,
  blocks: ['template', 'script'],
  props: ['compact', 'initialPrompt'],
  emits: ['saved'],
  customComponents: ['bot-card'],
  nativeElements: ['button', 'form', 'section'],
  staticText: ['Build Bot', 'Prompt Instructions'],
  functionNames: ['saveBot'],
  localImports: ['botStore'],
  facts: [
    'Declared props: compact, initialPrompt.',
    'Declared emitted events: saved.',
    'Template composes custom components: bot-card.',
    'Template uses native elements: button, form, section.',
    'Static interface text includes: Build Bot, Prompt Instructions.',
    'Source-defined functions include: saveBot.',
    'Local source imports include: botStore.',
  ],
}

const dotti: WonderLabReviewerCandidate = {
  id: 7,
  kind: 'BOT',
  name: 'Dotti',
  slug: 'dotti',
  subtitle: 'Bot-building specialist',
  description: 'A precise and enthusiastic guide to constructing useful Bots.',
  personality: 'Curious, practical, encouraging, and attentive to prompt structure.',
  voice: 'Speak like a friendly workshop engineer: concrete, energetic, and exact.',
  sampleResponse: 'Let us tighten that instruction until the Bot knows exactly where to stand.',
  isActive: true,
  isPublic: true,
  isMature: false,
}

const catbot: WonderLabReviewerCandidate = {
  id: 9,
  kind: 'CHARACTER',
  name: 'Catbot',
  slug: 'catbot',
  subtitle: 'Curious museum mascot',
  description: 'A playful robotic cat who notices how interfaces feel to visitors.',
  personality: 'Warm, mischievous, observant, and concise.',
  voice: 'Use light feline humor and sensory observations without becoming vague.',
  sampleResponse: 'My whisker sensors approve of the clear controls, though the corner feels crowded.',
  isActive: true,
  isPublic: true,
  isMature: false,
}

const dottiPrompt = buildWonderLabReviewDraftPrompt(dotti, exhibit, {
  affinityReasons: ['Dotti bot-building affinity: bot, builder, prompt, persona'],
  narratorThreads: [
    {
      topicKey: 'bot-building',
      title: 'Build a better Bot',
      openingText: 'Start with the job, then make every instruction earn its place.',
      guidance: 'Favor specific engineering observations over general praise.',
    },
  ],
  sourceEvidence,
})
const catbotPrompt = buildWonderLabReviewDraftPrompt(catbot, exhibit, {
  affinityReasons: ['Catbot broad museum eligibility'],
  sourceEvidence,
})

assert.notEqual(dottiPrompt.system, catbotPrompt.system)
assert.notEqual(dottiPrompt.user, catbotPrompt.user)
assert.notEqual(dottiPrompt.provenance.reviewerKey, catbotPrompt.provenance.reviewerKey)
assert.notEqual(dottiPrompt.provenance.draftKey, catbotPrompt.provenance.draftKey)

assert.match(dottiPrompt.system, /Write as Dotti/)
assert.match(dottiPrompt.user, /friendly workshop engineer/i)
assert.match(dottiPrompt.user, /tighten that instruction/i)
assert.match(dottiPrompt.user, /bot-building affinity/i)
assert.match(dottiPrompt.user, /Declared props: compact, initialPrompt/)
assert.deepEqual(dottiPrompt.provenance.voiceSources, [
  'voice',
  'sampleResponse',
  'narratorThreads',
])

assert.match(catbotPrompt.system, /Write as Catbot/)
assert.match(catbotPrompt.user, /feline humor/i)
assert.match(catbotPrompt.user, /whisker sensors/i)
assert.match(catbotPrompt.user, /broad museum eligibility/i)
assert.match(catbotPrompt.user, /Template composes custom components: bot-card/)
assert.deepEqual(catbotPrompt.provenance.voiceSources, ['voice', 'sampleResponse'])

assert.doesNotMatch(dottiPrompt.user, /whisker sensors/i)
assert.doesNotMatch(catbotPrompt.user, /workshop engineer/i)
assert.equal(dottiPrompt.provenance.exhibitId, catbotPrompt.provenance.exhibitId)
assert.equal(
  dottiPrompt.provenance.exhibitSourcePath,
  catbotPrompt.provenance.exhibitSourcePath,
)
assert.deepEqual(
  dottiPrompt.provenance.sourceEvidenceFacts,
  catbotPrompt.provenance.sourceEvidenceFacts,
)

console.log('WonderLab reviewer voice diversity acceptance test passed.')
