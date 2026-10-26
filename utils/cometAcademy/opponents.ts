import { IDENTITY_ARCS, identityFor, type IdentityArc } from './identityArcs'
import type { SignaturePowerId } from './specialPowers'

// The eight conspiracies are plans, not a roster cap. The opponent is one
// of the 48 canonical people, with the same identity/quest data as the player.
export function campaignOpponent(
  seed: number,
  protagonist?: SignaturePowerId,
  saved?: SignaturePowerId,
): IdentityArc {
  if (saved) return identityFor(saved)
  const candidates = IDENTITY_ARCS.filter(
    (person) => person.signature !== protagonist,
  )
  const index = (Math.trunc(seed) >>> 0) % candidates.length
  return candidates[index]!
}

// Threat is driven by the two distinct identity kits, never by a replacement
// codename. A hero's established strength can actually counter the villain's
// most-used stat. Zero is a valid stalemate.
export function opponentPressure(
  protagonist?: SignaturePowerId,
  villain?: SignaturePowerId,
): number {
  if (!protagonist || !villain) return 0
  const hero = identityFor(protagonist).hero.stats
  const foe = identityFor(villain).villain.stats
  // Attack planning against the hero's ability to anticipate and counter it.
  // A maximum villain stat of five is not automatically unbeatable.
  const difference = (foe.smarts + foe.control) - (hero.smarts + hero.control)
  return difference >= 2 ? 1 : difference <= -2 ? -1 : 0
}

export function antagonistBeat(
  opponent: IdentityArc,
  day: number,
): string {
  if (day < 15)
    return `A student with a story nobody has heard in full is caught between two futures: ${opponent.student.conflict} The city has not yet connected this secret to the conspiracy.`
  if (day < 20)
    return `${opponent.realName}, once known at the academy as ${opponent.student.alias}, is now linked to the ${opponent.villain.alias} identity. ${opponent.quests.antagonist} ${opponent.villainDecision}`
  return `${opponent.villain.alias} acts through ${opponent.villain.focus} tactics: ${opponent.villain.method} ${opponent.quests.antagonist}`
}

export function antagonistFinale(
  opponent: IdentityArc,
  hasCounterplay: boolean,
): string {
  return hasCounterplay
    ? `${opponent.realName} chose the name ${opponent.villain.alias}, but their defeat does not erase the person: ${opponent.backstory} The public now knows the cost of the plan: ${opponent.villain.method}`
    : `${opponent.villain.alias} still controls part of the battlefield: ${opponent.villain.method} Investigators must contend with a motive rooted in ${opponent.backstory}`
}
