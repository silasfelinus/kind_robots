import {
  STARTER_CARD_IDS,
  allianceProblems,
  allianceStarterWithMix,
  type AllianceDeck,
} from './alliance'
import { CARDS, cardById, type Card, type TeamId } from './prototypes'

/** Crew-neutral tactical tools. Use free mercenaries, not faction-specific buffs.
 * Availability is equal across crews; strategic benefit must still be measured. */
export type MercenaryBridgePlan = 'control' | 'synergy'

const PREFERENCES: Record<
  MercenaryBridgePlan,
  { creatures: readonly string[]; support: readonly string[] }
> = {
  control: {
    creatures: [
      'merc-fungal-bouncer',
      'merc-traffic-witch',
      'merc-roof-dentist',
      'merc-picket-troll',
      'merc-bus-driver',
      'merc-grease-oracle',
    ],
    support: [
      'merc-homebrew-antidote',
      'merc-reputation-laundry',
      'merc-misaddressed-parcel',
      'merc-borrowed-kneepads',
      'merc-secondhand-halo',
      'merc-red-tape-scissors',
    ],
  },
  synergy: {
    creatures: [
      'merc-smog-moth',
      'merc-skate-taxidermist',
      'merc-sewer-sommelier',
      'merc-bribe-rat',
      'merc-escape-crab',
      'merc-spark-midwife',
    ],
    support: [
      'merc-streetlight-confession',
      'merc-flashmob-diversion',
      'merc-take-stairs',
      'merc-counterfeit-license',
      'merc-union-solidarity',
      'merc-squeaky-wheel',
    ],
  },
}

const baseMercenaries = CARDS.filter(
  (card) => card.team === 'mercenary' && STARTER_CARD_IDS.has(card.id),
)

function choose(
  plan: MercenaryBridgePlan,
  kind: 'creatures' | 'support',
): Card[] {
  const options = baseMercenaries.filter(
    (card) => (card.kind === 'creature') === (kind === 'creatures'),
  )
  const preferred = PREFERENCES[plan][kind]
  const sorted = [...options].sort((a, b) => {
    const ia = preferred.indexOf(a.id)
    const ib = preferred.indexOf(b.id)
    const pa = ia < 0 ? preferred.length : ia
    const pb = ib < 0 ? preferred.length : ib
    return pa - pb || a.cost - b.cost || a.id.localeCompare(b.id)
  })
  if (sorted.length < 2) throw new Error('Mercenary starter pool has no ' + kind)
  return sorted.slice(0, 2)
}

/** Swap four general cards for the same accessible neutral support package
 * in every directed alliance. Preserve the ally's seven-card share and
 * fighter-forward's 12 fighters / 8 support cards. Never overwrite a save. */
export function mercenaryBridgeDeck(
  general: TeamId,
  ally: TeamId,
  plan: MercenaryBridgePlan,
): AllianceDeck {
  const original = allianceStarterWithMix(general, ally, 'fighter-forward')
  const ours = original.cards.filter((id) => cardById(id).team === general)
  const creatures = ours.filter((id) => cardById(id).kind === 'creature')
  const support = ours.filter((id) => cardById(id).kind !== 'creature')
  const replaced = new Set([...creatures.slice(-2), ...support.slice(-2)])
  const mercenaries = [
    ...choose(plan, 'creatures'),
    ...choose(plan, 'support'),
  ].map((card) => card.id)
  const deck = {
    general,
    ally,
    cards: [
      ...original.cards.filter((id) => !replaced.has(id)),
      ...mercenaries,
    ],
  }
  if (allianceProblems(deck).length)
    throw new Error('Invalid ' + plan + ' mercenary bridge for ' + general)
  return deck
}

/** Exactly which neutral cards a proposed recipe borrows. */
export function mercenaryBridgePackage(
  plan: MercenaryBridgePlan,
): readonly string[] {
  return [...choose(plan, 'creatures'), ...choose(plan, 'support')].map(
    (card) => card.id,
  )
}
