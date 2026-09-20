// utils/rulerHooked/advisor.selftest.ts
//
// Headless behavioral test of the standing advisor (ruler-hooked/t-028), run
// via `npx tsx` -- same convention as engine.selftest.ts / game.selftest.ts /
// encounter.selftest.ts. Proves the advisor is present in content, resolves
// a stable priority order (ending > catch > escape > kingdom extremes >
// welcome > idle), and stays deterministic given the same save state.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import {
  ADVISOR_CHARACTER_SLUG,
  currentAdvisorLine,
} from '~/utils/rulerHooked/advisor'
import {
  CHARACTER_EXPRESSION_KEYS,
  characterPortraitPath,
  characterFallbackPortraitPath,
  characterPortraitPrompt,
} from '~/utils/rulerHooked/characterArt'
import { RULER_HOOKED_OPENING } from '~/utils/rulerHooked/opening'
import type { RunSave } from '~/types/ruler-hooked'

const fresh = (): RunSave =>
  createRun(C, {
    saveId: 'sv_advisor',
    name: 'Test Reign',
    seed: 'mo-4820',
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })

// 1. The advisor is a real, seeded content Character -- content-slug parity
//    the task asked for, checkable without a database.
{
  const advisor = C.characters.find((c) => c.slug === ADVISOR_CHARACTER_SLUG)
  assert.ok(advisor, 'advisor Character is present in the content bundle')
  assert.equal(advisor!.name, 'Quill')
  assert.equal(
    RULER_HOOKED_OPENING.narratorSlug,
    ADVISOR_CHARACTER_SLUG,
    'the opening is voiced by the same advisor character',
  )
}

// 2. New reign, no transient state: the welcome line, mood neutral.
{
  const s = fresh()
  const line = currentAdvisorLine(C, s, {})
  assert.match(line.text, /Quill/, 'first-turn line introduces the advisor')
  assert.equal(line.mood, 'neutral')
}

// 3. Priority: a pending ending outranks everything else, including an
//    extreme kingdom-health axis that would otherwise fire.
{
  const s = fresh()
  s.kingdomHealth.treasury = 5 // would trigger the "alarmed" low-axis branch alone
  const ending = C.endings[0]
  assert.ok(ending, 'fixture has at least one ending to test against')
  const line = currentAdvisorLine(C, s, { pendingEnding: ending!.outcomeKey })
  assert.notEqual(
    line.mood,
    'neutral',
    'a pending ending always produces a non-neutral read',
  )
  // The ending's own victoryType must drive the mood, not the low axis.
  if (ending!.victoryType === 'VICTORY') assert.equal(line.mood, 'pleased')
  if (ending!.victoryType === 'FAILURE') assert.equal(line.mood, 'alarmed')
}

// 4. A fresh discovery catch is a pleased reaction, and beats a low axis too.
{
  const s = fresh()
  s.kingdomHealth.order = 10
  const line = currentAdvisorLine(C, s, {
    lastCatch: {
      fishSlug: 'test-fish',
      name: 'Test Carp',
      affinity: 'NEUTRAL',
      rarity: 'COMMON',
      sizeCm: 20,
      qualityScore: 50,
      quality: 'ORDINARY',
      newDiscovery: true,
      countCaught: 1,
      fishopediaNote: '',
      consequenceReveal: '',
      catchBehavior: '',
      coinsFound: 0,
    },
  })
  assert.equal(line.mood, 'pleased')
  assert.match(line.text, /Test Carp/)
}

// 5. Kingdom-health extremes fire once nothing bigger is happening, and pick
//    the same axis every time for the same input (deterministic, no ties
//    resolved by Math.random).
{
  const s = fresh()
  s.kingdomHealth.nature = 10
  s.kingdomHealth.joy = 5
  const a = currentAdvisorLine(C, s, {})
  const b = currentAdvisorLine(C, s, {})
  assert.equal(a.mood, 'alarmed')
  assert.deepEqual(a, b, 'same save + context -> identical line every call')
}

// 6. Idle fallback is deterministic per (seed, turnCount) and stays inside
//    the pool -- never throws on an out-of-range pick.
{
  const s = fresh()
  s.turnCount = 7
  s.choiceLog.push({
    turn: 1,
    cardId: 'x',
    prompt: 'p',
    choiceText: 'c',
    effects: {},
  })
  const a = currentAdvisorLine(C, s, {})
  const b = currentAdvisorLine(C, s, {})
  assert.deepEqual(a, b, 'idle line is stable for the same turn')
  s.turnCount = 8
  const c = currentAdvisorLine(C, s, {})
  assert.ok(c.text.length > 0)
}

// 7. Portrait/expression contract: every expression key resolves to a
//    distinct, well-formed path, and the prompt builder never throws on a
//    character with sparse optional fields.
{
  const paths = new Set(
    CHARACTER_EXPRESSION_KEYS.map((e) =>
      characterPortraitPath(ADVISOR_CHARACTER_SLUG, e),
    ),
  )
  assert.equal(
    paths.size,
    CHARACTER_EXPRESSION_KEYS.length,
    'every expression gets a distinct portrait path',
  )
  assert.equal(
    characterFallbackPortraitPath(ADVISOR_CHARACTER_SLUG),
    '/images/ruler-hooked/character-steward-quill.webp',
  )
  const prompt = characterPortraitPrompt({
    name: 'Nix',
    expression: 'alarmed',
  })
  assert.match(prompt, /Nix/)
  assert.match(prompt, /wide-eyed alarm/)
}

console.log('ruler-hooked ADVISOR self-test: ALL PASS')
