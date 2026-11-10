// The base collection every account owns from the start.
// Silas, 2026-11-10 PT: "all users should start with an open collection of 20
// cards from each faction and/or mercenaries. there wouldn't be all unlocked,
// but there's a significant chunk. from now on, everyone, including me as
// admin, should be restricted to those base cards and then cards that they
// particularly unlock in play modes or booster packs (earned through playing)."
//
// Each crew's canonical 20-card Solo Clash deck (its founders included), plus
// twenty non-rare mercenaries spread across the cost curve. Everything else
// comes from packs and play.
import { clashDeck } from './clash'
import { MERCENARY_RARE_IDS } from './mercenaryCards'
import { CARDS, TEAMS } from './prototypes'

export const BASE_MERCENARY_COUNT = 20

function baseMercenaries(dealt: ReadonlySet<string>): string[] {
  const pool = CARDS.filter(
    (card) =>
      card.team === 'mercenary' &&
      !MERCENARY_RARE_IDS.has(card.id) &&
      !dealt.has(card.id),
  ).sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
  const want = Math.max(0, BASE_MERCENARY_COUNT - dealt.size)
  return Array.from(
    { length: Math.min(want, pool.length) },
    (_, i) => pool[Math.floor(((i + 0.5) * pool.length) / want)]!.id,
  )
}

const crewCards = TEAMS.flatMap((team) => clashDeck(team.id))
const dealtMercenaries = new Set(
  crewCards.filter(
    (id) => CARDS.find((card) => card.id === id)?.team === 'mercenary',
  ),
)

/** Every card an account owns before it opens a pack or wins one in play. */
export const BASE_CARD_IDS: readonly string[] = [
  ...new Set([...crewCards, ...baseMercenaries(dealtMercenaries)]),
]
export const BASE_CARD_SET: ReadonlySet<string> = new Set(BASE_CARD_IDS)
