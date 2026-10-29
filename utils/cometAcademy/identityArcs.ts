import catalog from './identityArcs.json'
import { GUEST_IDENTITIES, type GuestIdentity } from './guestIdentities'
import {
  fieldForStats,
  type LegacyPowerId,
  type PersonaStats,
  type SignaturePowerId,
} from './specialPowers'

export type Persona = {
  alias: string
  focus: string
  stats: PersonaStats
}

export type IdentityArc = {
  signature: SignaturePowerId
  realName: string
  pronouns: string
  backstory: string
  heroDecision: string
  villainDecision: string
  sidekick: string
  romance: string
  student: Persona & { conflict: string }
  hero: Persona & { method: string }
  villain: Persona & { method: string }
  quests: { protagonist: string; antagonist: string; partner: string }
}

/** The 48 origin-affinity people keep one codename in every role. Role-specific stats,
 * motives and scenes remain different, but no role creates a new named character. */
export const IDENTITY_ARCS = catalog.identityCatalog as IdentityArc[]
const bySignature = new Map(IDENTITY_ARCS.map((arc) => [arc.signature, arc]))

export function fieldFor(signature: SignaturePowerId): LegacyPowerId {
  return fieldForStats(identityFor(signature).student.stats)
}

export function identityFor(signature: SignaturePowerId): IdentityArc {
  const identity = bySignature.get(signature)
  if (!identity) throw new Error(`Missing identity for ${signature}`)
  return identity
}

export type CharacterIdentity = IdentityArc | GuestIdentity
/** Zuzu's guest-arrival event is retained for existing saves, but his canonical
 * playable identity is now part of the 48. Never show two Zuzus in the roster. */
export const CHARACTER_ROSTER: CharacterIdentity[] = [
  ...IDENTITY_ARCS,
  ...GUEST_IDENTITIES.filter((guest) => guest.id !== 'guest-zuzu'),
]

export type CharacterViewpoint = 'protagonist' | 'antagonist'
export type CharacterAllegiance = 'hero' | 'villain'
export type CharacterBond = 'sidekick' | 'partner' | 'romance'

export function identityStoryFor(
  character: CharacterIdentity,
  viewpoint: CharacterViewpoint,
  allegiance: CharacterAllegiance,
  bonds: readonly CharacterBond[] = [],
) {
  const persona = character[allegiance]
  const setup =
    viewpoint === 'protagonist'
      ? allegiance === 'hero'
        ? character.quests.protagonist
        : character.villainDecision
      : allegiance === 'hero'
        ? character.heroDecision
        : character.quests.antagonist
  const decision =
    allegiance === 'hero' ? character.heroDecision : character.villainDecision
  const bondScenes: string[] = []
  if (bonds.includes('sidekick')) bondScenes.push(character.sidekick)
  if (bonds.includes('partner')) bondScenes.push(character.quests.partner)
  if (bonds.includes('romance')) bondScenes.push(character.romance)
  return {
    person: character.realName,
    backstory: character.backstory,
    studentAlias: character.student.alias,
    alias: persona.alias,
    method: persona.method,
    viewpoint,
    allegiance,
    setup,
    decision,
    bondScenes,
  }
}
