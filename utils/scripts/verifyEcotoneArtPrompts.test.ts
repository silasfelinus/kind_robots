// Ecotone picture prompts (conductor weird-humboldt t-069):
//   npx tsx utils/scripts/verifyEcotoneArtPrompts.test.ts
import assert from 'node:assert/strict'
import {
  ECOTONE_CARD_ART_PROMPTS,
  ECOTONE_STORYLINE_ART_PROMPTS,
} from '../ecotone/artPrompts'
import { cardArtKey } from '../ecotone/artSlots'
import { ALL_CARDS } from '../ecotone/engine'
import {
  MYSTERIES,
  MYSTERY_CARDS,
  mysteryEndingArtKey,
} from '../ecotone/mysteries'
import { MYSTERY_ART_PROMPTS } from '../ecotone/mysteries/artPrompts'
import { isEcotoneReviewHeldArtSubject } from '../ecotone/reviewHold'
import { buildEcotonePlaybook } from '../playbook/ecotone'

const cardKeys = new Set(ALL_CARDS.map((card) => cardArtKey(card.id)))
for (const asset of Object.keys(ECOTONE_CARD_ART_PROMPTS))
  assert.ok(cardKeys.has(asset), `${asset} is a story or encounter card`)

const mysteryKeys = new Set([
  ...MYSTERY_CARDS.map((card) => cardArtKey(card.id)),
  ...MYSTERIES.flatMap((m) =>
    m.endings.map((ending) => mysteryEndingArtKey(m.id, ending.id)),
  ),
])
for (const asset of Object.keys(MYSTERY_ART_PROMPTS))
  assert.ok(mysteryKeys.has(asset), `${asset} is a mystery scene or ending`)

const all = {
  ...ECOTONE_CARD_ART_PROMPTS,
  ...MYSTERY_ART_PROMPTS,
  ...Object.fromEntries(
    Object.entries(ECOTONE_STORYLINE_ART_PROMPTS).map(([lead, prompt]) => [
      `storylines/${lead}`,
      prompt ?? '',
    ]),
  ),
}
for (const [asset, prompt] of Object.entries(all)) {
  assert.ok(
    !isEcotoneReviewHeldArtSubject({ asset, prompt }),
    `${asset} stays clear of held art`,
  )
  assert.ok(!/\bMara\b/.test(prompt), `${asset} leaves Mara's portrait held`)
  assert.ok(!/\banthro|furry\b/i.test(prompt), `${asset} keeps animals real`)
}

const book = buildEcotonePlaybook()
assert.ok(book.artPromptsComplete)
for (const node of Object.values(book.nodes))
  if (node.needsArt) assert.ok(node.artPrompt, `${node.key} has a prompt`)

console.log(
  `Ecotone art prompts: ${Object.keys(all).length} literal prompts, every unpainted Forge beat covered`,
)
