// The prompt contract must judge the string the renderer receives.
//
// 2026-09-20. /api/art/enqueue gated on the caller's `promptString`, which for
// krea2 is NOT what renders: buildKrea2WorkflowFromRequest runs the prompt
// through buildKreaSemanticPrompt before it reaches the CLIP node, and that is
// where kind-robots#2896 strips an entity's rules text back out.
//
// So the gate judged words that are never rendered. It refused 13 of the
// negation repair's re-renders whose rendered prompt was clean. Look at what
// it was quoting back: Reward 233 "Lucky Penny" was refused for "when the
// scene", which lives in its Effect -- "small useful coincidences exactly when
// the scene needs nudging". Reward 273 "Chosen One" was refused for "no single
// person should", from its Description -- "a weight of expectation no single
// person should carry". Ordinary English in a rules paragraph, never sent as
// art direction by anybody, and never rendered.
//
// From the caller's end a 422 quoting a phrase absent from the prompt it sent
// is indistinguishable from the contract having lost its mind. The same gate
// blocks a human re-rendering any Reward whose rules text happens to contain a
// negation -- which, for a game catalog, is most of them.
//
// The measurement that settled it: across 1,135 queued repair jobs, 1,132
// carried the entity block in `payload.promptString` and ZERO carried it in
// the CLIP node. The metadata was dirty; the render was always clean.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildKreaSemanticPrompt } from '../kreaSemanticPrompt'
import { extractWorkflowPrompt } from '../../server/api/comfy/utils/engineWorkflow'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'

const here = dirname(fileURLToPath(import.meta.url))
const KREA = { engine: 'krea2', cfg: 1, steps: 8 } as const

// Reward 233 "Lucky Penny" and Reward 273 "Chosen One", as stored on
// kindrobots.org on 2026-09-20, composed the way buildEntityArtPrompt composes
// them: the repaired caption, the slot framing, then the entity's own text.
const CASES = [
  {
    id: 233,
    caption:
      'A single glowing coin spinning at the heart of a soft golden ripple ' +
      'of fortune, tiny sparkles cascading off it, warm and humble rather ' +
      'than grand. Warm gold-and-copper glow, crisp clean linework, quiet ' +
      'good fortune, simple background. An unpeopled frame, the subject ' +
      'alone, the space around it bare and deserted.',
    entity: [
      'Name: Lucky Penny',
      'Type: SKILL',
      'Rarity: COMMON',
      "Description: You're lucky in small, specific, plot-relevant ways. Not " +
        'jackpots — the right coin in your pocket, the green light, the ' +
        'dropped clue that lands face-up. Minor fortune, exquisitely well-timed.',
      'Effect: The holder enjoys minor, well-timed strokes of luck — small ' +
        'useful coincidences exactly when the scene needs nudging. Keep it ' +
        'modest and frequent; it greases moments rather than rewriting them.',
    ],
    quoted: 'when the scene',
    survives: 'glowing coin spinning',
  },
  {
    id: 273,
    caption:
      'A single figure-silhouette beneath a vast convergence of prophetic ' +
      'light-beams and swirling fate-lines all bending inward toward it, ' +
      'chosen and weighed-upon. Luminous destiny-gold against cosmic dark, ' +
      'crisp clean linework, fated and heavy, simple background. An ' +
      'unpeopled frame, the subject alone, the space around it bare and deserted.',
    entity: [
      'Name: Chosen One',
      'Type: SKILL',
      'Rarity: LEGENDARY',
      'Description: Prophecy bends events around you whether you asked for ' +
        'it or not. Destiny keeps arranging coincidences, survivals, and ' +
        'impossible convergences in your favor — and saddling you with a ' +
        'weight of expectation no single person should carry.',
    ],
    quoted: 'no single person should',
    survives: 'swirling fate-lines',
  },
]

for (const testCase of CASES) {
  const composed = [
    testCase.caption,
    '',
    'Compose this as a square composition centred on one clear subject for the following reward.',
    ...testCase.entity,
    `Existing art prompt: ${testCase.caption}`,
    '',
    'Treat the first paragraph as the primary art direction. Use the entity ' +
      'context for identity and continuity, not as a checklist and not as text to render.',
  ].join('\n')

  const label = `reward/${testCase.id}`

  // The phrase the gate quoted back is in the entity text and nowhere else.
  assert.ok(
    composed.includes(testCase.quoted),
    `${label}: fixture must carry the phrase the gate quoted`,
  )
  assert.ok(
    !testCase.caption.includes(testCase.quoted),
    `${label}: the phrase must NOT be in the caption -- that is the whole point`,
  )

  // 1. The composed string and the rendered string are genuinely different.
  const rendered = buildKreaSemanticPrompt(composed)
  for (const leak of ['Description:', 'Effect:', 'Existing art prompt:', testCase.quoted]) {
    assert.ok(
      !rendered.includes(leak),
      `${label}: "${leak}" must not survive into the rendered prompt`,
    )
  }
  assert.ok(
    rendered.includes(testCase.survives),
    `${label}: the caption is the picture and must survive`,
  )

  // 2. The bug itself, asserted rather than described: the same job is
  //    rejected before the workflow builder and clean after it.
  assert.ok(
    checkArtPromptContract({ prompt: composed, ...KREA }).length > 0,
    `${label}: the composed string is expected to violate -- it carries the rules text`,
  )
  const afterBuilder = checkArtPromptContract({ prompt: rendered, ...KREA })
  assert.equal(
    afterBuilder.length,
    0,
    `${label}: the rendered prompt must pass; got ${JSON.stringify(afterBuilder)}`,
  )
}

// 3. Source contract: the gate must run AFTER the payload exists and must read
//    the prompt out of it. An assertion on ordering, because the failure mode
//    is a refactor quietly moving the gate back above the builder -- where it
//    still passes every behavioural test while judging the wrong string again.
const source = readFileSync(
  resolve(here, '../../server/api/art/enqueue.post.ts'),
  'utf8',
)
const buildAt = source.indexOf('const { jobEngine, payload } = buildJobPayload(')
const extractAt = source.indexOf('extractWorkflowPrompt(payload)')
// lastIndexOf: the FIRST assertArtPromptContract is the author-level gate,
// which deliberately runs before the payload exists. The graph gate is the
// last one.
const gateAt = source.lastIndexOf('checkArtPromptContract({')
assert.ok(buildAt > 0, 'expected buildJobPayload in enqueue.post.ts')
assert.ok(extractAt > 0, 'the gate must read the prompt out of the built GRAPH')
assert.ok(gateAt > 0, 'expected checkArtPromptContract in enqueue.post.ts')
assert.ok(
  buildAt < extractAt && extractAt < gateAt,
  'the render check must run after buildJobPayload, on the workflow prompt',
)
assert.ok(
  !source.includes('extractRenderRequest(payload).prompt'),
  'do NOT use extractRenderRequest here: it prefers promptString and only ' +
    'falls back to the CLIP node, which made the first fix a silent no-op',
)
// Two checks, deliberately, doing different jobs: the caller's own text before
// entity context is composed in, and the graph after the sanitizer has run.
assert.equal(
  source.split('checkArtPromptContract({').length - 1,
  2,
  'expected exactly two checks: the author-level one and the graph one',
)
const authorGateAt = source.indexOf('prompt: basePromptString,')
assert.ok(authorGateAt > 0, 'the author-level check must judge basePromptString')
assert.ok(
  authorGateAt < buildAt,
  'the author-level check runs before the payload is built -- it is about the ' +
    'caller\'s text, not the render',
)
assert.ok(
  !source.includes('prompt: contextualBasePrompt,'),
  'never judge the composed string: the entity Description and Effect are not ' +
    'the caller\'s art direction, and judging them caused 13 false refusals',
)

// ADVISORY, not blocking. Silas, 2026-09-20: "just make prompts that work ...
// maybe loosen things to a warning when it comes to actually submitting
// prompts? This shouldn't be an issue that comes to me." A 422 here lands on
// whoever pressed Generate rather than whoever wrote the prompt, and stops work
// that would have rendered fine -- buildKreaSemanticPrompt already strips the
// caption before it reaches the graph. The findings ride along on the job
// instead, tagged by which string they came from.
assert.ok(
  !source.includes('assertArtPromptContract'),
  'enqueue must not throw on a contract violation -- it records warnings',
)
assert.ok(
  source.includes('payload.promptWarnings = promptWarnings'),
  'the findings must be recorded on the job so a producer can still see them',
)
for (const scope of ["scope: 'author' as const", "scope: 'render' as const"]) {
  assert.ok(
    source.includes(scope),
    `warnings must record ${scope} so the two checks stay distinguishable`,
  )
}

// 4. The no-op that shipped. The first version of this fix gated on
//    `extractRenderRequest(payload).prompt`, which takes `payload.promptString`
//    first and only falls back to the CLIP node. On this lane promptString IS
//    the dirty composed string, so the gate read exactly what it had before:
//    production came up reporting the new commit and went on refusing the same
//    13 records. Nothing in the behavioural assertions above could see that,
//    because they never went through a payload. So: a payload whose two fields
//    DISAGREE, asserting the graph wins.
const payloadWithDisagreeingFields = {
  promptString: 'a crowd of bystanders, no readable text, Description: rules prose',
  workflow: {
    '3': {
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Prompt)' },
      inputs: { text: 'a single glowing coin on a bare dark ground' },
    },
    '4': {
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Negative)' },
      inputs: { text: 'blurry, lowres, watermark' },
    },
  },
}
assert.equal(
  extractWorkflowPrompt(payloadWithDisagreeingFields),
  'a single glowing coin on a bare dark ground',
  'the graph must win over promptString, and the negative node must be skipped',
)
assert.equal(
  checkArtPromptContract({
    prompt: extractWorkflowPrompt(payloadWithDisagreeingFields),
    ...KREA,
  }).length,
  0,
  'gating the graph passes where gating promptString would not',
)
assert.ok(
  checkArtPromptContract({
    prompt: payloadWithDisagreeingFields.promptString,
    ...KREA,
  }).length > 0,
  'fixture is only meaningful if promptString genuinely violates',
)
assert.equal(
  extractWorkflowPrompt({ promptString: 'no graph here' }),
  '',
  'no graph returns empty so the caller can fall back rather than gate nothing',
)

// 5. The sanitizer hides author mistakes from a graph-only gate.
//    buildKreaSemanticPrompt REWRITES the caption on its way to the CLIP node:
//    "a red cube, no bystanders, plain ground" becomes "a red cube, plain
//    ground". So the render is genuinely clean and a graph-only gate accepts
//    it -- correctly, as far as the image goes, and uselessly as far as the
//    author goes. The negation stays in the stored artPrompt and gets re-sent
//    forever, which is precisely the condition the 2026-09-19 pass spent 1,154
//    records cleaning up. Hence the second gate on the caller's own text.
const AUTHOR_NEGATION = 'a red cube, no bystanders, plain ground'
const sanitized = buildKreaSemanticPrompt(AUTHOR_NEGATION)
assert.ok(
  !sanitized.includes('no bystanders'),
  'fixture assumes the sanitizer strips the negation; if it stopped doing ' +
    'that, this test is describing behaviour that no longer exists',
)
assert.equal(
  checkArtPromptContract({ prompt: sanitized, ...KREA }).length,
  0,
  'the sanitized render is clean, so a graph-only gate would accept it',
)
assert.ok(
  checkArtPromptContract({ prompt: AUTHOR_NEGATION, ...KREA }).some(
    (v: { rule: string }) => v.rule === 'people-negation',
  ),
  "so the author's own text must be gated separately, or the negation is " +
    'never reported to anyone',
)

console.log(
  `verifyEnqueuePromptGate: ok (${CASES.length} records + payload precedence + author gate)`,
)
