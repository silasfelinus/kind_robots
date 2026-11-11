// Story rewards are earned *inside a faction campaign*. They deliberately do
// not mutate the account's pack collection, Meat, or server-issued CPU rewards.
import { CARDS, TEAMS, seededHash, type TeamId } from './prototypes'
import { rarityOf } from './progression'
import type { CampaignSave } from './campaign'
import { soloProblems } from './alliance'

const FEATURED = [
  'Backwater IOU',
  'Stolen Bone Saw',
  'Spare Nine Lives',
  'Second Pounce Rig',
  'Encore or Die',
  'Union Reallocation',
  'Furnace Overdrive',
  'Posthumous Saint Medal',
  'Tunnel Harpoon',
  'Mark of the Procession',
  'Secondhand Halo',
  'Emergency Wings',
  'Theftproof Toolkit',
  'Broken Halo',
  'Union Suit',
]

function candidates(team: TeamId, claimed: string[]) {
  return CARDS.filter(
    (card) =>
      (card.team === team || card.team === 'mercenary') &&
      !claimed.includes(card.id) &&
      // The ten permanent founders need no story unlock.
      !TEAMS.find((crew) => crew.id === card.team)?.creatures.includes(
        card.id,
      ) &&
      !TEAMS.find((crew) => crew.id === card.team)?.special.includes(card.id),
  )
}

export function campaignCardChoices(
  save: CampaignSave,
  team: TeamId,
): [(typeof CARDS)[number], (typeof CARDS)[number]] | null {
  const p = save[team]
  const claimed = p.rewards ?? []
  if (p.wins < 1 || claimed.length >= p.wins) return null
  const chapter = claimed.length + 1
  const teamIndex = TEAMS.findIndex((crew) => crew.id === team)
  const available = candidates(team, claimed)
  if (available.length < 2) return null
  const firstPool = available.filter(
    (card) => card.team === team && FEATURED.includes(card.name),
  )
  const featured =
    firstPool[seededHash(teamIndex, chapter, 71) % firstPool.length]
  const crewCards = available.filter((card) => card.team === team)
  const first =
    featured ??
    crewCards[seededHash(teamIndex, chapter, 73) % crewCards.length]!
  const rest = available.filter((card) => card.id !== first.id)
  // Later chapters guarantee a rare alternative, not just a lucky cosmetic label.
  const rareChapter = chapter >= 3
  const preferred = rareChapter
    ? rest.filter((card) => rarityOf(card) === 'rare')
    : rest.filter((card) => rarityOf(card) !== 'common')
  const secondPool = preferred.length ? preferred : rest
  const second =
    secondPool[seededHash(teamIndex, chapter, 79) % secondPool.length]!
  return [first, second]
}

export function chooseCampaignCard(
  save: CampaignSave,
  team: TeamId,
  id: string,
): CampaignSave {
  const options = campaignCardChoices(save, team)
  if (!options?.some((card) => card.id === id)) return save
  const progress = save[team]
  return {
    ...save,
    [team]: { ...progress, rewards: [...(progress.rewards ?? []), id] },
  }
}

/** An earned card enters *Story* Solo Clash without rewriting account decks.
 * Replaces the oldest non-earned slot, preserving exactly twenty unique cards.
 */
export function campaignSoloDeck(
  save: CampaignSave,
  team: TeamId,
  base: string[],
): string[] {
  const earned = (save[team].rewards ?? []).filter((id) =>
    CARDS.some(
      (card) =>
        card.id === id && (card.team === team || card.team === 'mercenary'),
    ),
  )
  const deck = [...earned, ...base.filter((id) => !earned.includes(id))].slice(
    0,
    20,
  )
  return soloProblems(team, deck).length ? base : deck
}
