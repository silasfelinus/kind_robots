// utils/rulerHooked/cardArt.selftest.ts
//
// Headless behavioral test of the card image ladder (ruler-hooked/t-030), run
// via `npx tsx` -- same convention as advisor.selftest.ts / engine.selftest.ts.
// Proves the ladder orders dedicated card art before character portraits,
// degrades correctly when either is missing, and stays content-consistent
// with the one card in RULER_HOOKED_CONTENT that already authors `art:`.

import assert from 'node:assert/strict'
import { cardArtPath, cardImageCandidates } from '~/utils/rulerHooked/cardArt'
import {
  characterFallbackPortraitPath,
  characterPortraitPath,
} from '~/utils/rulerHooked/characterArt'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'

// 1. Dedicated card art, when authored, leads the ladder, followed by the
//    featured character's neutral portrait and then its plain fallback.
{
  const candidates = cardImageCandidates(
    'card-warlock-druid-north',
    'warlock-vex',
  )
  assert.deepEqual(candidates, [
    cardArtPath('card-warlock-druid-north'),
    characterPortraitPath('warlock-vex', 'neutral'),
    characterFallbackPortraitPath('warlock-vex'),
  ])
}

// 2. No card art authored: falls straight to the character rungs.
{
  const candidates = cardImageCandidates(undefined, 'druid-sela')
  assert.deepEqual(candidates, [
    characterPortraitPath('druid-sela', 'neutral'),
    characterFallbackPortraitPath('druid-sela'),
  ])
}

// 3. Neither card art nor a character slug (shouldn't happen in practice --
//    the caller always has at least the relaying advisor -- but the ladder
//    must degrade to nothing rather than throw).
{
  assert.deepEqual(cardImageCandidates(undefined, undefined), [])
}

// 4. Content-consistency: the one card in the live bundle that authors `art:`
//    still resolves through the real path helper without a typo.
{
  const deck = C.decks.flatMap((d) => d.cards)
  const arcSteps = C.arcs.flatMap((a) => a.steps)
  const withArt = [...deck, ...arcSteps].find((card) => card.art)
  assert.ok(withArt, 'at least one authored card sets art: in content.ts')
  assert.equal(
    cardArtPath(withArt!.art!),
    `/images/ruler-hooked/${withArt!.art}.webp`,
  )
}

console.log('ruler-hooked CARD ART self-test: ALL PASS')
