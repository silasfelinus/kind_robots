// /utils/scripts/verifyLoraProbeSubject.test.ts
//
// The probe scaffold must name a subject when the LoRA does not -- and must not
// when it does.
//
// Measured across all 2,658 probe jobs (2026-09-16): 81.2% carried no subject
// noun, 49.4% were a single tag, the median prompt was two tags, and 11 were
// empty. Those render something arbitrary rather than nothing, which is why the
// style half of the triage grid was never comparable LoRA-to-LoRA.
//
// The opposite error is already documented in loraProbe.ts and cost a real
// misread: an unconditional 'single subject' contradicted the "Very Small
// Women" LoRA's own two-figure triggers and the render dropped a figure, which
// scanned as a broken LoRA. Both directions are pinned here.
//
// Plain assert script, no test framework -- same discipline as
// utils/scripts/verifyRevenueSplit.test.ts (this repo does not depend on
// vitest; these `.test.ts` files run directly via `tsx`).
import assert from 'node:assert/strict'

import {
  buildLoraProbePrompt,
  capProbeTriggerTags,
  probeSubjectClause,
  sanitizeProbeTrigger,
  triggerNamesSubject,
} from '../loraProbe'

const pony = (trigger: string) => buildLoraProbePrompt('pony', trigger)!.prompt

// --- probe subject injection ------------------------------------------------

// gives a subject to the 81% that name none
assert.ok(pony('anna').includes('anna, 1girl'))
assert.ok(pony('Apple - Style').includes('Apple - Style, 1girl'))
assert.ok(pony('').includes('score_7_up, 1girl'))

// leaves a multi-figure concept alone
{
  // kind-robots/t-105: the concept is a size DIFFERENCE and cannot render
  // without two figures. Adding `1girl` here is the bug, not the fix.
  const out = pony('large male, t1nyg1rlz, very small female')
  assert.equal(triggerNamesSubject('large male, t1nyg1rlz, very small female'), true)
  assert.ok(!out.includes('1girl'))
  assert.ok(out.includes('large male, t1nyg1rlz, very small female'))
}

// leaves an explicit subject alone rather than stacking another
assert.ok(pony('1girl, blue hair').includes('1girl, blue hair'))
assert.ok(!pony('1girl, blue hair').includes('1girl, blue hair, 1girl'))
assert.ok(!pony('1boy, armor').includes('1girl'))

// treats framing words as framing, not as a subject
{
  // 'portrait'/'upper body'/'face' say how to frame a subject, not what it is.
  assert.equal(triggerNamesSubject('portrait'), false)
  assert.equal(triggerNamesSubject('upper body'), false)
  assert.ok(pony('portrait').includes('portrait, 1girl'))
}

// does not mistake the base model for a subject
{
  // Found by running this against the live queue after the first pass: these
  // four counted as having a subject and so were left without one.
  for (const t of [
    'Bartolomeobari Style - Pony XL',
    'Deadflow (Bee) Style Pony XL',
    'Custom Pony Styles Collection',
    'Sky ( Artist Style ) Pony',
  ]) {
    assert.equal(triggerNamesSubject(sanitizeProbeTrigger(t)), false, t)
  }
  // ...while a genuine My Little Pony LoRA is still caught, by `girl`.
  assert.equal(triggerNamesSubject('my little pony, pony girl'), true)
}

// strips a spaced "Pony XL" the way it strips "PonyXL"
assert.ok(!/pony/i.test(sanitizeProbeTrigger('Bartolomeobari Style - Pony XL')))

// treats "character sheet" as a format, not a subject
assert.equal(triggerNamesSubject('character sheet, multiple views, expressions'), false)

// still detects plurals, monsters and creatures
assert.equal(triggerNamesSubject('multiple girls, harem, 3girls'), true)
assert.equal(triggerNamesSubject('Piranha Plant [Set3], Tentacle Monster'), true)
assert.equal(triggerNamesSubject('Fantastic Dragon'), true)

// --- trigger capping ---------------------------------------------------------

// caps a trigger dump from the front
{
  const dump = 'a, b, c, d, e, f, g, h, i, j, k, l'
  assert.equal(capProbeTriggerTags(dump), 'a, b, c, d, e, f, g, h')
}

// caps the twenty-concept pile without mangling its escapes
{
  const pile = Array.from({ length: 20 }, (_, i) => `mix_(x${i})`).join(', ')
  const out = pony(pile)
  assert.ok(out.includes('mix_\\(x0\\)'))
  assert.ok(!out.includes('mix_\\(x9\\)'))
}

// leaves a short trigger list untouched
assert.equal(capProbeTriggerTags('a, b, c'), 'a, b, c')
assert.equal(capProbeTriggerTags(''), '')

// --- prose lanes -------------------------------------------------------------

// uses a prose subject, not a Danbooru token, where T5 reads the prompt
// `1girl` is meaningless to T5.
assert.ok(buildLoraProbePrompt('flux', 'anna')!.prompt.includes('a woman'))
assert.ok(!buildLoraProbePrompt('flux', 'anna')!.prompt.includes('1girl'))
assert.ok(buildLoraProbePrompt('zimage', '')!.prompt.includes('a woman'))

// --- negative prompt ----------------------------------------------------------

// names the specific crop failure, not just "cropped"
{
  // Both figures in the 2026-09-16 Pony strip came back cut off at the mouth
  // with 'cropped' already present.
  const neg = buildLoraProbePrompt('pony', 'x')!.negativePrompt
  assert.ok(neg.includes('head out of frame'))
  assert.ok(neg.includes('cropped head'))
}

// --- subject clause is shared by every SD-lineage family ---------------------

for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
  assert.ok(buildLoraProbePrompt(family, 'anna')!.prompt.includes('anna, 1girl'), family)
}

// --- probeSubjectClause: the single place the default lives ------------------

assert.equal(probeSubjectClause(''), '1girl')
assert.equal(probeSubjectClause('', true), 'a woman')

// --- framing scaffold ---------------------------------------------------------

// never says "frame" -- the model reads it as a picture frame
{
  // ArtJob 26318: a Batgirl probe came back as a framed picture on a wall.
  // 'frame' supplied the frame, 'simple uncluttered background' the wall.
  for (const family of ['pony', 'illustrious', 'sdxl', 'sd15', 'flux', 'zimage'] as const) {
    assert.ok(!/\bframe\b/i.test(buildLoraProbePrompt(family, 'Batgirl')!.prompt), family)
  }
}

// still places the subject and clears the background
{
  const out = buildLoraProbePrompt('sdxl', 'Batgirl')!.prompt
  assert.ok(out.includes('centered'))
  assert.ok(out.includes('simple uncluttered background'))
}

console.log('verifyLoraProbeSubject: all assertions passed')
