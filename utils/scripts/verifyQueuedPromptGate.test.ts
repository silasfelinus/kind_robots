// The CLAIM-time gate must judge the graph too, not just the enqueue gate.
//
// 2026-09-20. kind-robots#2915 fixed /api/art/enqueue to read the CLIP node
// instead of payload.promptString. There is a SECOND gate, at claim time
// (claim.post.ts -> assertQueuedArtPromptContract), and it still read
// promptString. So ten repair jobs passed enqueue and then died on the way to
// the renderer with "ArtJob validation failed before claim", quoting phrases
// that live only in a Reward's Description and Effect:
//
//   reward/233 "when the scene"      -> "coincidences exactly when the scene needs nudging"
//   reward/273 "no single person should" -> "a weight of expectation no single person should carry"
//   reward/2687 "never for the person"   -> its Description
//
// The lesson worth pinning is not the precedence itself -- that is asserted
// below -- but that fixing ONE gate proved nothing about the others. Both gates
// are now checked here, together, so a future fix to either cannot silently
// leave the other reading the wrong string.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  queuedArtPrompt,
  queuedArtRenderPrompt,
} from '../../server/utils/artJobQueueSettings'

// A payload whose two prompt-shaped fields DISAGREE, which is exactly the shape
// /api/art/enqueue produces for krea2: promptString is the pre-semantic
// composed string, the node holds what buildKreaSemanticPrompt made of it.
const payload = {
  promptString:
    'A single glowing coin. Compose this as a square composition for the ' +
    'following reward. Name: Lucky Penny Effect: small useful coincidences ' +
    'exactly when the scene needs nudging.',
  workflow: {
    '3': {
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Prompt)' },
      inputs: { text: 'a single glowing coin spinning on a bare dark ground' },
    },
    '4': {
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Negative)' },
      inputs: { text: 'blurry, lowres, watermark' },
    },
  },
}

assert.equal(
  queuedArtRenderPrompt(payload),
  'a single glowing coin spinning on a bare dark ground',
  'the gate reader must take the graph and skip the negative node',
)
assert.ok(
  !queuedArtRenderPrompt(payload).includes('when the scene'),
  'entity rules text must not reach the claim-time gate',
)

// queuedArtPrompt keeps its promptString-first precedence: coverage reporting
// wants what the caller asked for, and changing it there would move unrelated
// numbers.
assert.ok(
  queuedArtPrompt(payload).includes('when the scene'),
  'queuedArtPrompt is deliberately unchanged — only the GATE reader is new',
)

// No graph: fall back rather than wave the job through ungated.
assert.equal(
  queuedArtRenderPrompt({ promptString: 'a bare lantern' }),
  'a bare lantern',
  'a payload with no workflow must still be judged',
)

// Source contract, both gates together. Fixing one and forgetting the other is
// the actual failure being prevented here.
const claimGate = readFileSync('server/utils/artJobQueueSettings.ts', 'utf8')
assert.ok(
  claimGate.includes('prompt: queuedArtRenderPrompt(payload)'),
  'assertQueuedArtPromptContract must judge the graph',
)
assert.ok(
  !claimGate.includes('prompt: queuedArtPrompt(payload)'),
  'the claim gate must not read promptString — that is what failed 10 jobs',
)

const enqueue = readFileSync('server/api/art/enqueue.post.ts', 'utf8')
assert.ok(
  enqueue.includes('extractWorkflowPrompt(payload)'),
  'the enqueue gate must still read the graph too (kind-robots#2915)',
)

console.log('verifyQueuedPromptGate: ok (claim gate + enqueue gate agree)')
