// utils/rulerHooked/artPrompts.selftest.ts
//
// Every picture the game shows has an authored Krea 2 prompt, no prompt is
// orphaned from the content it paints, and a recurring character is described
// the same way on every card they appear on.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import { RULER_PRESETS } from '~/utils/rulerHooked/rulerPresets'
import { GEAR_CATALOG, KINGDOM_CATALOG } from '~/utils/rulerHooked/economy'
import { RULER_HOOKED_OPENING } from '~/utils/rulerHooked/opening'
import {
  CAST_LOOK,
  CARD_PROMPTS,
  CHARACTER_PROMPTS,
  ENDING_PROMPTS,
  FISH_PROMPTS,
  OPENING_PROMPTS,
  REWARD_PROMPTS,
  RULER_PROMPTS,
  SHOP_PROMPTS,
  rulerHookedArtPrompt,
} from '~/utils/rulerHooked/artPrompts'

const sameKeys = (
  label: string,
  prompts: Record<string, string>,
  ids: string[],
) =>
  assert.deepEqual(
    Object.keys(prompts).sort(),
    [...ids].sort(),
    `${label} prompts match content`,
  )

const cards = [
  ...C.decks.flatMap((d) => d.cards),
  ...C.arcs.flatMap((a) => a.steps),
]
sameKeys(
  'card',
  CARD_PROMPTS,
  cards.filter((c) => c.art).map((c) => c.id),
)
sameKeys(
  'character',
  CHARACTER_PROMPTS,
  C.characters.map((c) => c.slug),
)
sameKeys(
  'cast look',
  CAST_LOOK,
  C.characters.map((c) => c.slug),
)
sameKeys(
  'ending',
  ENDING_PROMPTS,
  C.endings.map((e) => e.outcomeKey),
)
sameKeys(
  'fish',
  FISH_PROMPTS,
  RULER_HOOKED_FISH.map((f) => f.slug),
)
sameKeys(
  'ruler',
  RULER_PROMPTS,
  RULER_PRESETS.map((r) => r.id),
)
sameKeys(
  'reward',
  REWARD_PROMPTS,
  C.rewards.map((r) => r.slug),
)
sameKeys(
  'shop',
  SHOP_PROMPTS,
  [...GEAR_CATALOG, ...KINGDOM_CATALOG].map((i) => i.id),
)
assert.equal(OPENING_PROMPTS.length, RULER_HOOKED_OPENING.beats.length)

for (const card of cards) {
  if (!card.art) continue
  assert.equal(
    card.art,
    `card-${card.id}`,
    `${card.id} art key follows card-<id>`,
  )
  const prompt = CARD_PROMPTS[card.id]!
  for (const slug of card.characters ?? []) {
    const name = CAST_LOOK[slug]!.split(',')[0]!
    if (prompt.includes(name))
      assert.ok(
        prompt.includes(CAST_LOOK[slug]!),
        `${card.id} draws ${name} from CAST_LOOK`,
      )
  }
  assert.ok(
    !prompt.includes(card.title),
    `${card.id} prompt does not carry its title`,
  )
}

for (const prompt of [
  ...Object.values(CARD_PROMPTS),
  ...Object.values(CHARACTER_PROMPTS),
  ...Object.values(ENDING_PROMPTS),
  ...Object.values(FISH_PROMPTS),
  ...Object.values(RULER_PROMPTS),
  ...Object.values(REWARD_PROMPTS),
  ...Object.values(SHOP_PROMPTS),
  ...OPENING_PROMPTS,
]) {
  assert.ok(
    prompt.length >= 120 && prompt.length <= 900,
    `prompt length ${prompt.length}`,
  )
  assert.ok(
    !/\b(?:no|not|without|never|like a|as if|symbol\w*)\b/i.test(prompt),
    prompt,
  )
}

assert.equal(
  rulerHookedArtPrompt('card:warlock-druid-north'),
  CARD_PROMPTS['warlock-druid-north'],
)
assert.equal(
  rulerHookedArtPrompt('opening:3'),
  CHARACTER_PROMPTS['steward-quill'],
)
assert.equal(rulerHookedArtPrompt('fish:missing'), undefined)

console.log(
  'ruler-hooked art prompts: every card, fish, character, ruler, reward, shop item and ending is prompted',
)
