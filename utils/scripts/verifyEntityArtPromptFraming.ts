// /utils/scripts/verifyEntityArtPromptFraming.ts
//
// Entity-art prompts must never name their slot ("card", "icon", "hero") or pile
// up text nouns. Krea 2 is a distilled diffusion transformer on the Qwen-Image
// lineage with no instruction-following layer, and it runs at cfg 1 — which
// makes the ComfyUI negative prompt inert, so every word of the prompt is
// positive conditioning.
//
// On 2026-08-08 "Create this as the card artwork for the following scenario"
// produced literal trading cards: title bar, type line, and a rules box full of
// invented text. The trailing "Do not add captions, labels, UI chrome,
// watermarks, signatures, or readable text unless the primary art direction
// explicitly requests them" contributed the rest — six text nouns plus a
// condition the model cannot evaluate.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  artContextRules,
  artSlotFraming,
} from '../../utils/entityArtPromptFraming'

// Format nouns a diffusion model can mistake for the subject.
const SLOT_NOUNS = ['card', 'icon', 'hero', 'banner', 'emblem', 'thumbnail']

const SLOTS = [
  { label: 'Card', width: 512, height: 768 },
  { label: 'Hero', width: 1280, height: 720 },
  { label: 'Icon', width: 256, height: 256 },
  { label: 'Avatar', width: 1024, height: 1024 },
  { label: 'Reward', width: 1024, height: 1024 },
]

for (const slot of SLOTS) {
  const framing = artSlotFraming(slot).toLowerCase()
  assert.ok(framing.length > 0, `${slot.label} produced no framing`)
  for (const noun of SLOT_NOUNS) {
    assert.ok(
      !framing.includes(noun),
      `artSlotFraming(${slot.label}) leaked the format noun "${noun}": ${framing}`,
    )
  }
}

// Geometry, not the label, decides the framing.
assert.match(artSlotFraming(SLOTS[0]!), /vertical portrait/)
assert.match(artSlotFraming(SLOTS[1]!), /wide landscape/)
assert.match(artSlotFraming(SLOTS[2]!), /square/)
// A mislabelled slot still gets framing that matches its real aspect ratio.
assert.match(
  artSlotFraming({ label: 'Card', width: 1280, height: 720 }),
  /wide landscape/,
)
// Degenerate dimensions must not throw or emit a slot noun.
assert.ok(artSlotFraming({ label: 'Card', width: 0, height: 0 }).length > 0)

// The trailing rules stay short and free of the noun pile.
const rules = artContextRules('entity').join(' ').toLowerCase()
for (const noun of ['captions', 'labels', 'ui chrome', 'watermarks', 'signatures']) {
  assert.ok(!rules.includes(noun), `artContextRules still names "${noun}"`)
}
assert.ok(
  !rules.includes('unless'),
  'artContextRules still carries a conditional the image model cannot evaluate',
)

// Neither caller may reintroduce the slot-naming phrase.
for (const file of [
  'server/utils/entityArt.ts',
  'stores/dailyDreamArchiveStore.ts',
]) {
  const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
  const body = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  assert.ok(
    !/Create this as the \$\{/.test(body),
    `${file} names its art slot in the prompt again; use artSlotFraming()`,
  )
  assert.ok(
    !/captions, labels, UI chrome/.test(body),
    `${file} reintroduced the text-noun pile; use artContextRules()`,
  )
}

console.log('Entity art prompt framing verified (no slot nouns, no text-noun pile).')
